import { Token, stringifyToken } from "./lexer"
import { Stack } from "./stack"

export type EVar = { tag: "var", name: string }
export type EInt = { tag: "int", value: number }
export type ECall = { tag: "call", name: string, arguments: Array<Expression> }
export type EBrackets = { tag: "brackets", expr: Expression }
export type Expression = EVar | EInt | ECall | EBrackets

export type SExpr = { tag: "expr", expr: Expression }
export type SLet = { tag: "let", name: string, value: Expression }
export type SNoop = { tag: "noop" }
export type Statement = SExpr | SLet | SNoop

export function parseStatements(tokens: Stack<Token>): Array<Statement> {
    const statements: Array<Statement> = [];

    let token: Token | undefined;
    while ((token = tokens.pop()) != undefined) {
        switch (token.tag) {
            case "semicolon": break;
            default: {
                tokens.push(token);
                const expr = parseExpression(tokens);
                statements.push({ tag: "expr", expr });

                const token2 = tokens.pop();
                if (token2?.tag != "semicolon") {
                    throw Error(`Expected semicolon but found ${stringifyToken(token2)} instead.`);
                }
            }
        }
    }

    return statements;
}

export function parseFunctionParams(tokens: Stack<Token>): Array<Expression> {
    // Finish the no argument call seperately
    if (tokens.peek()?.tag == "rbracket") {
        console.assert(tokens.pop()?.tag == "rbracket");
        return [];
    }

    // Functions with 1 or more arguments
    const funcArguments = [parseExpression(tokens)];

    while (true) {
        const token = tokens.pop();
        switch (token?.tag) {
            case "rbracket":
                return funcArguments;
            case "comma":
                const expr = parseExpression(tokens);
                funcArguments.push(expr);
            case undefined:
                throw Error("Expected closing bracket of function call, found end of program.");
            default:
                throw Error(`Expected closing bracket of function call or comma. Found ${stringifyToken(token)} instead.`);
        }
    }
}

export function parseExpression(tokens: Stack<Token>): Expression {
    const token = tokens.pop();
    if (token === undefined) {
        throw Error("Expected expression but found end of program.");
    }

    switch (token.tag) {
        case "identifier": {
            // Parse function call
            if (tokens.peek()?.tag == "lbracket") {
                console.assert(tokens.pop()?.tag == "lbracket");
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
            const token = tokens.pop();
            if (token?.tag != "rbracket") {
                throw Error(`Expected right bracket but found ${stringifyToken(token)} instead`);
            }
            return { tag: "brackets", expr };
        }
        default:
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
    }
}
