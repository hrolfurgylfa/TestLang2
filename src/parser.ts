import { TokenConsumer } from "./token_consumer"
import { TLSyntaxError } from "./errors"
import { assertUnreachable } from "./helpers"

export type BinaryOperator = "==" | "!=" | "<" | ">" | "<=" | ">=" | "+" | "-" | "*" | "/"

export type EVar = { tag: "var", name: string }
export type EInt = { tag: "int", value: number }
export type ECall = { tag: "call", name: string, arguments: Array<Expression> }
export type EBrackets = { tag: "brackets", expr: Expression }
export type EBinary = { tag: "binary", left: Expression, right: Expression, op: BinaryOperator }
export type EUnary = { tag: "unary", expr: Expression, op: "!" | "-" }
export type Expression = EVar | EInt | ECall | EBrackets | EBinary | EUnary

export type SScope = { tag: "scope", statements: Array<Statement> }
export type SIf = { tag: "if", run: SScope | Expression, unless: SUnless }
export type SUnless = { tag: "unless", condition: Expression, then: SThen | undefined }
export type SThen = { tag: "then", run: SScope | Expression, unless: SUnless | undefined }
export type SExpr = { tag: "expr", expr: Expression }
export type SLet = { tag: "let", name: string, value: Expression }
export type SNoop = { tag: "noop" }
export type Statement = SScope | SIf | SExpr | SLet | SNoop

function syntaxError(tokens: TokenConsumer, expected: string, options?: { peek?: boolean }): never {
    const defaultOpt = { peek: false };
    const opt = { ...defaultOpt, ...options } || defaultOpt
    const { token, loc } = opt.peek ? tokens.peekFull() : tokens.previousFull();
    throw new TLSyntaxError(
        `Expected ${expected} but found ${token.tag} instead.` +
        `\n\nLine: ${loc.line}, Column: ${loc.column}.`);
}

function parseExpressionBody(tokens: TokenConsumer): SScope | Expression {
    let run: SScope | Expression;
    if (tokens.match("curlylbracket")) {
        run = { tag: "scope", statements: parseStatements(tokens) };
    } else {
        run = parseExpression(tokens);
    }
    return run;
}

function parseUnless(tokens: TokenConsumer): SUnless | undefined {
    if (tokens.match("unless")) {
        const condition = parseExpression(tokens);

        return { tag: "unless", condition, then: parseThen(tokens) }
    } else return undefined;
}

function parseThen(tokens: TokenConsumer): SThen | undefined {
    if (tokens.match("then")) {
        const run = parseExpressionBody(tokens);

        return { tag: "then", run, unless: parseUnless(tokens) }
    } else return undefined;
}

export function parseStatements(tokens: TokenConsumer): Array<Statement> {
    const statements: Array<Statement> = [];

    while (true) {
        const token = tokens.peek();
        switch (token.tag) {
            case "semicolon":
                console.assert(tokens.advance().tag == "semicolon");
                break;
            case "eof": return statements;
            case "curlyrbracket":
                console.assert(tokens.advance().tag == "curlyrbracket");
                return statements;
            case "comment":
                console.assert(tokens.advance().tag == "comment");
                break;
            default: {
                const run = parseExpressionBody(tokens);
                const unless = parseUnless(tokens);
                if (unless) {
                    statements.push({ tag: "if", run, unless });
                } else {
                    if (run.tag == "scope") statements.push(run);
                    else {
                        statements.push({ tag: "expr", expr: run });
                        if (tokens.match("semicolon")) break;
                        else syntaxError(tokens, "semicolon", { peek: true });
                    }
                }
            }
        }
    }
}

export function parseFunctionParams(tokens: TokenConsumer): Array<Expression> {
    // Finish the no argument call seperately
    if (tokens.match("rbracket")) {
        return [];
    }

    // Functions with 1 or more arguments
    const funcArguments = [parseExpression(tokens)];

    while (true) {
        const token = tokens.advance();
        switch (token?.tag) {
            case "rbracket":
                return funcArguments;
            case "comma":
                const expr = parseExpression(tokens);
                funcArguments.push(expr);
            default:
                syntaxError(tokens, "closing bracket of function call or comma");
        }
    }
}


export function parseExpression(tokens: TokenConsumer): Expression {
    return parseEquality(tokens);
}

export function parseEquality(tokens: TokenConsumer): Expression {
    let expr = parseComparison(tokens);

    let token; while ((token = tokens.match("equality"))) {
        const right = parseComparison(tokens);
        expr = { tag: "binary", left: expr, right, op: token.reverse ? "!=" : "==" };
    }

    return expr;
}

export function parseComparison(tokens: TokenConsumer): Expression {
    let expr = parseTerm(tokens);

    let token; while ((token = tokens.match("comparison"))) {
        const right = parseTerm(tokens);
        expr = { tag: "binary", left: expr, right, op: token.op };
    }

    return expr;
}

export function parseTerm(tokens: TokenConsumer): Expression {
    let expr = parseFactor(tokens);

    let token; while ((token = tokens.matchMul("add", "subtract"))) {
        const right = parseFactor(tokens);
        expr = { tag: "binary", left: expr, right, op: token.tag == "add" ? "+" : "-" };
    }

    return expr;
}

export function parseFactor(tokens: TokenConsumer): Expression {
    let expr = parseUnary(tokens);

    let token; while ((token = tokens.matchMul("multiply", "divide"))) {
        const right = parseUnary(tokens);
        expr = { tag: "binary", left: expr, right, op: token.tag == "multiply" ? "*" : "/" };
    }

    return expr;
}

export function parseUnary(tokens: TokenConsumer): Expression {
    if (tokens.matchMul("bang", "subtract")) {
        const op = tokens.previous();
        const right = parseUnary(tokens);
        return { tag: "unary", expr: right, op: op.tag == "bang" ? "!" : "-" };
    }

    return parsePrimary(tokens);
}

function parsePrimary(tokens: TokenConsumer): Expression {
    const token = tokens.peek();
    tokens.advance();

    switch (token.tag) {
        case "identifier": {
            // Parse function call
            if (tokens.peek()?.tag == "lbracket") {
                console.assert(tokens.advance().tag == "lbracket");
                return { tag: "call", name: token.value, arguments: parseFunctionParams(tokens) };
            }

            // Parse variable usage
            return { tag: "var", name: token.value };
        }
        case "int": return { tag: "int", value: token.value };
        case "true": return { tag: "int", value: 1 };
        case "false": return { tag: "int", value: 0 };
        case "lbracket": {
            const expr = parseExpression(tokens);
            const token = tokens.advance();
            if (token.tag != "rbracket")
                syntaxError(tokens, "right bracket");
            return { tag: "brackets", expr };
        }
        default:
            syntaxError(tokens, "expression");
    }
}

function stringifyBodyExpression(bodyExpr: SScope | Expression, indent: number) {
    if (bodyExpr.tag == "scope") {
        return _stringifyAst([bodyExpr], indent);
    } else {
        return " ".repeat(indent) + stringifyExpression(bodyExpr);
    }
}

function stringifyUnless(unless: SUnless, indent: number): string {
    return ` unless ${stringifyExpression(unless.condition)}${unless.then ? stringifyThen(unless.then, indent) : ";"}`;
}

function stringifyThen(then: SThen, indent: number): string {
    return ` then ${stringifyBodyExpression(then.run, indent)}${then.unless ? stringifyUnless(then.unless, indent) : ";"}`;
}

export function stringifyAst(statements: Array<Statement>): string { return _stringifyAst(statements, 0); }
function _stringifyAst(statements: Array<Statement>, indent: number): string {
    const indentStr = " ".repeat(indent);
    let ret = "";

    for (const statement of statements) {
        switch (statement.tag) {
            case "expr": ret += indentStr + stringifyExpression(statement.expr) + ";"; break;
            case "let": ret += `${indentStr}let ${statement.name} = ${stringifyExpression(statement.value)};`; break;
            case "noop": break;
            case "scope":
                console.log(`Hello ${indent}`);
                ret += `${indentStr}{\n${_stringifyAst(statement.statements, indent + 4)}\n${indentStr}}`;
                break;
            case "if": ret += `${stringifyBodyExpression(statement.run, indent)}${stringifyUnless(statement.unless, indent)}`; break;
            default: assertUnreachable(statement);
        }
        ret += "\n";
    }

    return ret.slice(0, -1);
}

export function stringifyExpression(expr: Expression): string {
    switch (expr.tag) {
        case "var": return `${expr.name}`;
        case "int": return `${expr.value}`;
        case "call": return `${expr.name}(${expr.arguments.map(stringifyExpression).join(", ")})`;
        case "brackets": return `(${stringifyExpression(expr.expr)})`;
        case "binary": return `${stringifyExpression(expr.left)} ${expr.op} ${stringifyExpression(expr.right)}`;
        case "unary": return `${expr.op}${stringifyExpression(expr.expr)}`;
    }
}
