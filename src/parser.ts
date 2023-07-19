import { stringifyToken } from "./lexer"
import { TokenConsumer } from "./token_consumer"

export type BinaryOperator = "==" | "!=" | "<" | ">" | "<=" | ">=" | "+" | "-" | "*" | "/"

export type EVar = { tag: "var", name: string }
export type EInt = { tag: "int", value: number }
export type ECall = { tag: "call", name: string, arguments: Array<Expression> }
export type EBrackets = { tag: "brackets", expr: Expression }
export type EBinary = { tag: "binary", left: Expression, right: Expression, op: BinaryOperator }
export type EUnary = { tag: "unary", expr: Expression, op: "!" | "-" }
export type Expression = EVar | EInt | ECall | EBrackets | EBinary | EUnary

export type SExpr = { tag: "expr", expr: Expression }
export type SLet = { tag: "let", name: string, value: Expression }
export type SNoop = { tag: "noop" }
export type Statement = SExpr | SLet | SNoop

export function parseStatements(tokens: TokenConsumer): Array<Statement> {
    const statements: Array<Statement> = [];

    while (true) {
        const token = tokens.peek();
        switch (token.tag) {
            case "semicolon": console.assert(tokens.advance().tag == "semicolon");
            case "eof": return statements;
            default: {
                const expr = parseExpression(tokens);
                statements.push({ tag: "expr", expr });

                const token2 = tokens.advance();
                if (token2.tag != "semicolon") {
                    throw Error(`Expected semicolon but found ${stringifyToken(token2)} instead.`);
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
                throw Error(`Expected closing bracket of function call or comma. Found ${stringifyToken(token)} instead.`);
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
            if (token.tag != "rbracket") {
                throw Error(`Expected right bracket but found ${stringifyToken(token)} instead`);
            }
            return { tag: "brackets", expr };
        }
        default:
            console.log(tokens);
            throw Error(`Expected expression but found ${stringifyToken(token)} instead.`);
    }
}

export function stringifyAst(statements: Array<Statement>): string { return _stringifyAst(statements, 0); }
function _stringifyAst(statements: Array<Statement>, indent: number): string {
    const indentStr = " ".repeat(indent);
    let ret = "";

    for (const statement of statements) {
        ret += indentStr;
        switch (statement.tag) {
            case "expr": ret += stringifyExpression(statement.expr); break;
            case "let": ret += `let ${statement.name} = ${stringifyExpression(statement.value)}`; break;
            case "noop": break;
        }
        ret += `;\n`;
    }

    return ret;
}

export function stringifyExpression(expr: Expression): string {
    switch (expr.tag) {
        case "var": return `${expr.name}`;
        case "int": return `${expr.value}`;
        case "call": return `${expr.name}(${expr.arguments.map(stringifyExpression).join(", ")})`;
        case "brackets": return `(${stringifyExpression(expr.expr)})`;
        case "binary": return `${stringifyExpression(expr.left)} ${expr.op} ${stringifyExpression(expr.right)}`;
        case "unary": return `${expr.op} ${expr.expr}`;
    }
}
