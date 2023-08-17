import { Expression, ProgramInfo, SIf, SScope, SUnless, Statement } from "./parser"
import { assertUnreachable } from "./helpers";
import { Map as IMap } from "immutable";
import { TLNameError } from "./errors";

export type VFuncInternal = { tag: "internal_func", name: string | undefined, args: Array<string>, func: (args: Array<Value>) => Value }
export type VFunc = { tag: "func", name: string | undefined, args: Array<string>, body: Array<Statement>, env: Environment }
export type VInt = { tag: "int", value: number }
export type VNone = { tag: "none" }
export type Value = VFuncInternal | VFunc | VInt | VNone

export type Environment = IMap<string, Value>

function toBoolean(value: Value): boolean {
    switch (value.tag) {
        case "none": return false;
        case "int": return value.value != 0;
        default:
            throw Error(`Type ${value.tag} cannot be converted to true or false.`);
    }
}

function envNotFound(type: string, name: string): never {
    throw new TLNameError(`${type} ${name} could not be found in the current scope, are you sure it is spelled correctly?`);
}

function isComparible(left: Value, right: Value): boolean {
    switch (left.tag) {
        case "internal_func":
        case "func": return false;
        case "none": return right.tag == "none";
        case "int": return right.tag == "int";
    }
}

function isEqual(left: Value, right: Value): boolean {
    switch (left.tag) {
        case "internal_func":
        case "func": return false;
        case "none": return right.tag == "none";
        case "int": return right.tag == "int" && left.value == right.value;
    }
}

function isLess(left: Value, right: Value): boolean {
    switch (left.tag) {
        case "internal_func":
        case "func": return false;
        case "none": return right.tag == "none";
        case "int": return right.tag == "int" && left.value == right.value;
    }
}

export function evalExpression(pi: ProgramInfo, env: Environment, expr: Expression): Value {
    switch (expr.tag) {
        case "var":
            const val = env.get(expr.name);
            if (val == undefined) envNotFound("Variable", expr.name);
            return val;
        case "int": return { tag: "int", value: expr.value };
        case "call":
            const func = env.get(expr.name);
            if (func == undefined) envNotFound("Function", expr.name);
            switch (func.tag) {
                case "func":
                    if (func.args.length != expr.arguments.length)
                        throw Error(`Tried calling function ${func.name} with ${expr.arguments.length} arguments while the function expects ${func.args.length} arguments.`)
                    const funcEnv = func.env;
                    for (let i = 0; i < func.args.length; i++)
                        funcEnv.set(func.args[i], evalExpression(pi, env, expr.arguments[i]));
                    evalStatements(pi, funcEnv, func.body);
                    return { tag: "none" };
                case "internal_func":
                    return func.func(expr.arguments.map(e => evalExpression(pi, env, e)));
                default:
                    throw Error(`Cannot call argument of type ${func.tag} as a function.`);
            }
        case "brackets": return evalExpression(pi, env, expr.expr);
        case "binary":
            const left = evalExpression(pi, env, expr.left);
            const right = evalExpression(pi, env, expr.right);
            if (expr.op == "+" || expr.op == "-" || expr.op == "*" || expr.op == "/") {
                if (left.tag == "int" && right.tag == "int") {
                    switch (expr.op) {
                        case "+": return { tag: "int", value: left.value + right.value };
                        case "-": return { tag: "int", value: left.value - right.value };
                        case "*": return { tag: "int", value: left.value * right.value };
                        case "/": return { tag: "int", value: left.value / right.value };
                    }
                } else {
                    throw Error(`Cannot use operation ${expr.op} between ${left.tag} and ${right.tag}`);
                }
            } else {
                if (!isComparible(left, right)) return { tag: "int", value: 0 }
                switch (expr.op) {
                    case "==": return { tag: "int", value: +isEqual(left, right) };
                    case "!=": return { tag: "int", value: +!isEqual(left, right) };
                    case "<": return { tag: "int", value: +isLess(left, right) };
                    case ">=": return { tag: "int", value: +!isLess(left, right) };
                    case ">": return { tag: "int", value: +(!isLess(left, right) && !isEqual(left, right)) };
                    case "<=": return { tag: "int", value: +(!isLess(left, right) || isEqual(left, right)) };
                }
            }
            break; // TODO: ignore
        case "unary":
            const value = evalExpression(pi, env, expr.expr);
            if (value.tag != "int") {
                throw Error(`Cannot use unary operator ${expr.op} on ${value.tag}`);
            }
            switch (expr.op) {
                case "-": return { tag: "int", value: -value.value };
                case "!": return { tag: "int", value: +!value.value };
            }
    }
}

function evalExpressionBody(pi: ProgramInfo, env: Environment, exprBody: SScope | Expression) {
    if (exprBody.tag !== "scope") evalExpression(pi, env, exprBody);
    else evalStatements(pi, env, exprBody.statements);
}

function evalIfStatement(pi: ProgramInfo, env: Environment, ifStatement: SIf) {
    let unless: SUnless | undefined = ifStatement.unless;
    let run = ifStatement.run;

    while (true) {
        if (unless === undefined) {
            evalExpressionBody(pi, env, run);
            return;
        }

        if (!toBoolean(evalExpression(pi, env, unless.condition))) {
            // Unless is false, we execute the code in run.
            evalExpressionBody(pi, env, run);
            return;
        } else if (unless.then === undefined) {
            // We don't have any more "else if" statements
            return;
        } else {
            run = unless.then.run;
            unless = unless.then.unless;
        }
    }
}

export function evalStatements(pi: ProgramInfo, env: Environment, statements: Array<Statement>) {
    for (const statement of statements) {
        switch (statement.tag) {
            case "expr": evalExpression(pi, env, statement.expr); break;
            case "noop": break;
            case "let":
                env = env.set(statement.name, evalExpression(pi, env, statement.value));
                break;
            case "scope":
                evalStatements(pi, env, statement.statements);
                break;
            case "if":
                evalIfStatement(pi, env, statement);
                break;
            case "goto":
                const identifier = statement.identifier;
                const loc = pi.jumpTable.get(identifier);
                // This comment may not have been intended to be a come from location
                if (loc === undefined) break;
                evalStatements(pi, env, statements.slice());
                break;
            default:
                assertUnreachable(statement);
        }
    }
}

export function evalSimple(pi: ProgramInfo, statements: Array<Statement>) { evalStatements(pi, defaultEnv, statements) }

export function toString(value: Value): string {
    switch (value.tag) {
        case "internal_func": return `${value.name}(${value.args.join(", ")})`;
        case "func": return `${value.name}(${value.args.join(", ")})`;
        case "int": return `${value.value}`;
        case "none": return "none";
    }
}

function print(args: Array<Value>): Value {
    console.log(args.map(toString).join(" "));
    return { tag: "none" };
}

export const defaultEnv: IMap<string, Value> = IMap({
    print: { tag: "internal_func", name: "print", args: [], func: print },
});
