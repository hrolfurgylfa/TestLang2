import { TokenConsumer } from "./token_consumer"
import { assertUnreachable } from "./helpers"

export type BinaryOperator = "==" | "!=" | "<" | ">" | "<=" | ">=" | "+" | "-" | "*" | "/"

export type EVar = { tag: "var", name: string }
export type EInt = { tag: "int", value: number }
export type EString = { tag: "string", value: string }
export type ECall = { tag: "call", name: string, arguments: Array<Expression> }
export type EBrackets = { tag: "brackets", expr: Expression }
export type EBinary = { tag: "binary", left: Expression, right: Expression, op: BinaryOperator }
export type EUnary = { tag: "unary", expr: Expression, op: "!" | "-" }
export type ESet = { tag: "set", name: string, expr: Expression }
export type Expression = EVar | EInt | EString | ECall | EBrackets | EBinary | EUnary | ESet

export type SScope = { tag: "scope", statements: Array<Statement> }
export type SIf = { tag: "if", run: SScope | Expression, unless: SUnless }
export type SUnless = { tag: "unless", condition: Expression, then: SThen | undefined }
export type SThen = { tag: "then", run: SScope | Expression, unless: SUnless | undefined }
export type SExpr = { tag: "expr", expr: Expression }
export type SNoop = { tag: "noop" }
export type SGoto = { tag: "goto", identifier: string }
export type Statement = SScope | SIf | SExpr | SNoop | SGoto

export type JumpLocation = { scope: Statement[], numStatementsSkip: number }
export type ProgramInfo = { jumpTable: Map<string, Array<JumpLocation>> }

function parseExpressionBody(pi: ProgramInfo, tokens: TokenConsumer): SScope | Expression {
    let run: SScope | Expression;
    if (tokens.match("curlylbracket")) {
        run = { tag: "scope", statements: parseStatements(pi, tokens) };
    } else {
        run = parseExpression(pi, tokens);
    }
    return run;
}

function parseUnless(pi: ProgramInfo, tokens: TokenConsumer): SUnless | undefined {
    if (tokens.match("unless")) {
        const condition = parseExpression(pi, tokens);

        return { tag: "unless", condition, then: parseThen(pi, tokens) }
    } else return undefined;
}

function parseThen(pi: ProgramInfo, tokens: TokenConsumer): SThen | undefined {
    if (tokens.match("then")) {
        const run = parseExpressionBody(pi, tokens);

        return { tag: "then", run, unless: parseUnless(pi, tokens) }
    } else return undefined;
}

export function parseStatements(pi: ProgramInfo, tokens: TokenConsumer): Array<Statement> {
    const statements: Array<Statement> = [];

    while (true) {
        const token = tokens.peek();
        switch (token.tag) {
            case "semicolon":
                tokens.consume("semicolon");
                break;
            case "eof": return statements;
            case "curlyrbracket":
                tokens.consume("curlyrbracket");
                return statements;
            case "comment":
                const comment = tokens.consume("comment");
                if (comment.key !== undefined) {
                    statements.push({ tag: "goto", identifier: comment.key });
                }
                break;
            case "come":
                tokens.consume("come");
                tokens.consume("from");
                const identifier = tokens.consume("identifier").value;
                const locations = pi.jumpTable.get(identifier) || [];
                locations.push({ scope: statements, numStatementsSkip: statements.length });
                pi.jumpTable.set(identifier, locations);
                tokens.consume("semicolon");
                break;
            default: {
                const run = parseExpressionBody(pi, tokens);
                const unless = parseUnless(pi, tokens);
                if (unless) {
                    statements.push({ tag: "if", run, unless });
                } else {
                    if (run.tag == "scope") statements.push(run);
                    else {
                        statements.push({ tag: "expr", expr: run });
                        tokens.consume("semicolon");
                        break;
                    }
                }
            }
        }
    }
}

export function parseFunctionParams(pi: ProgramInfo, tokens: TokenConsumer): Array<Expression> {
    // Finish the no argument call seperately
    if (tokens.match("rbracket")) {
        return [];
    }

    // Functions with 1 or more arguments
    const funcArguments = [parseExpression(pi, tokens)];

    while (true) {
        const token = tokens.advance();
        switch (token.tag) {
            case "rbracket":
                return funcArguments;
            case "comma":
                const expr = parseExpression(pi, tokens);
                funcArguments.push(expr);
                break;
            default:
                tokens.errExpected("closing bracket of function call or comma");
        }
    }
}


export function parseExpression(pi: ProgramInfo, tokens: TokenConsumer): Expression {
    return parseEquality(pi, tokens);
}

export function parseEquality(pi: ProgramInfo, tokens: TokenConsumer): Expression {
    let expr = parseComparison(pi, tokens);

    let token; while ((token = tokens.match("equality"))) {
        const right = parseComparison(pi, tokens);
        expr = { tag: "binary", left: expr, right, op: token.reverse ? "!=" : "==" };
    }

    return expr;
}

export function parseComparison(pi: ProgramInfo, tokens: TokenConsumer): Expression {
    let expr = parseTerm(pi, tokens);

    let token; while ((token = tokens.match("comparison"))) {
        const right = parseTerm(pi, tokens);
        expr = { tag: "binary", left: expr, right, op: token.op };
    }

    return expr;
}

export function parseTerm(pi: ProgramInfo, tokens: TokenConsumer): Expression {
    let expr = parseFactor(pi, tokens);

    let token; while ((token = tokens.matchMul("add", "subtract"))) {
        const right = parseFactor(pi, tokens);
        expr = { tag: "binary", left: expr, right, op: token.tag == "add" ? "+" : "-" };
    }

    return expr;
}

export function parseFactor(pi: ProgramInfo, tokens: TokenConsumer): Expression {
    let expr = parseUnary(pi, tokens);

    let token; while ((token = tokens.matchMul("multiply", "divide"))) {
        const right = parseUnary(pi, tokens);
        expr = { tag: "binary", left: expr, right, op: token.tag == "multiply" ? "*" : "/" };
    }

    return expr;
}

export function parseUnary(pi: ProgramInfo, tokens: TokenConsumer): Expression {
    if (tokens.matchMul("bang", "subtract")) {
        const op = tokens.previous();
        const right = parseUnary(pi, tokens);
        return { tag: "unary", expr: right, op: op.tag == "bang" ? "!" : "-" };
    }

    return parsePrimary(pi, tokens);
}

function parsePrimary(pi: ProgramInfo, tokens: TokenConsumer): Expression {
    const token = tokens.peek();
    tokens.advance();

    switch (token.tag) {
        case "identifier": {
            // Parse function call
            if (tokens.match("lbracket")) {
                return { tag: "call", name: token.value, arguments: parseFunctionParams(pi, tokens) };
            }

            // Parse assignment
            if (tokens.match("assign")) {
                return { tag: "set", name: token.value, expr: parseExpression(pi, tokens) };
            }

            // Parse variable usage
            return { tag: "var", name: token.value };
        }
        case "int": return { tag: "int", value: token.value };
        case "string": return { tag: "string", value: token.value }
        case "true": return { tag: "int", value: 1 };
        case "false": return { tag: "int", value: 0 };
        case "lbracket": {
            const expr = parseExpression(pi, tokens);
            const token = tokens.advance();
            if (token.tag != "rbracket")
                tokens.errExpected("right bracket");
            return { tag: "brackets", expr };
        }
        default:
            tokens.errExpected("expression");
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
            case "noop": break;
            case "scope":
                console.log(`Hello ${indent}`);
                ret += `${indentStr}{\n${_stringifyAst(statement.statements, indent + 4)}\n${indentStr}}`;
                break;
            case "if": ret += `${stringifyBodyExpression(statement.run, indent)}${stringifyUnless(statement.unless, indent)}`; break;
            case "goto": ret += `${indentStr}// ${statement.identifier}`; break;
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
        case "string": return `"${expr.value}"`;
        case "call": return `${expr.name}(${expr.arguments.map(stringifyExpression).join(", ")})`;
        case "brackets": return `(${stringifyExpression(expr.expr)})`;
        case "binary": return `${stringifyExpression(expr.left)} ${expr.op} ${stringifyExpression(expr.right)}`;
        case "unary": return `${expr.op}${stringifyExpression(expr.expr)}`;
        case "set": return `${expr.name} = ${stringifyExpression(expr.expr)}`;
    }
}
