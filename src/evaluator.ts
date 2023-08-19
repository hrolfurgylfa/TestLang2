import { Expression, ProgramInfo, SIf, SScope, SUnless, Statement } from "./parser"
import { assert, assertUnreachable } from "./helpers";
import { Map as IMap } from "immutable";
import { TLNameError, GotoException } from "./errors";

export type VFuncInternal = { tag: "internal_func", name: string | undefined, args: Array<string>, func: (args: Array<Value>) => Value }
export type VFunc = { tag: "func", name: string | undefined, args: Array<string>, body: Array<Statement>, env: Environment }
export type VInt = { tag: "int", value: number }
export type VString = { tag: "string", value: string }
export type VNone = { tag: "none" }
export type Value = VFuncInternal | VFunc | VInt | VString | VNone

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
        case "string": return right.tag == "string";
    }
}

function isEqual(left: Value, right: Value): boolean {
    switch (left.tag) {
        case "internal_func":
        case "func": return false;
        case "none": return right.tag == "none";
        case "int": return right.tag == "int" && left.value == right.value;
        case "string": return right.tag == "string" && left.value == right.value;
    }
}

function isLess(left: Value, right: Value): boolean {
    switch (left.tag) {
        case "internal_func":
        case "func":
        case "none": return false;
        case "int": return right.tag == "int" && left.value < right.value;
        case "string": return false;
    }
}

export function evalExpression(pi: ProgramInfo, env: Environment, expr: Expression): { "env": Environment, "val": Value } {
    switch (expr.tag) {
        case "var":
            const val = env.get(expr.name);
            if (val == undefined) envNotFound("Variable", expr.name);
            return { env, val };
        case "int": return { env, val: { tag: "int", value: expr.value } };
        case "string": return { env, val: { tag: "string", value: expr.value } };
        case "set": {
            let { env: newEnv, val } = evalExpression(pi, env, expr.expr);
            newEnv = newEnv.set(expr.name, val);
            return { env: newEnv, val };
        }
        case "call":
            const func = env.get(expr.name);
            if (func == undefined) envNotFound("Function", expr.name);
            switch (func.tag) {
                case "func":
                    if (func.args.length != expr.arguments.length)
                        throw Error(`Tried calling function ${func.name} with ${expr.arguments.length} arguments while the function expects ${func.args.length} arguments.`)
                    let funcEnv = func.env;
                    let scopeEnv = env;
                    for (let i = 0; i < func.args.length; i++) {
                        const argExpr = evalExpression(pi, scopeEnv, expr.arguments[i]);
                        scopeEnv = argExpr.env;
                        funcEnv = funcEnv.set(func.args[i], argExpr.val);
                    }
                    evalStatements(pi, funcEnv, func.body);
                    return { env: scopeEnv, val: { tag: "none" } };
                case "internal_func": {
                    const values: Value[] = [];
                    let scopeEnv = env;
                    for (let i = 0; i < expr.arguments.length; i++) {
                        const argExpr = evalExpression(pi, scopeEnv, expr.arguments[i]);
                        scopeEnv = argExpr.env;
                        values.push(argExpr.val);
                    }
                    return { env: scopeEnv, val: func.func(values) };
                }
                default:
                    throw Error(`Cannot call argument of type ${func.tag} as a function.`);
            }
        case "brackets": return evalExpression(pi, env, expr.expr);
        case "binary":
            const { env: env1, val: left } = evalExpression(pi, env, expr.left);
            const { env: env2, val: right } = evalExpression(pi, env1, expr.right);
            if (expr.op == "+" || expr.op == "-" || expr.op == "*" || expr.op == "/") {
                if (left.tag == "int" && right.tag == "int") {
                    switch (expr.op) {
                        case "+": return { env: env2, val: { tag: "int", value: left.value + right.value } };
                        case "-": return { env: env2, val: { tag: "int", value: left.value - right.value } };
                        case "*": return { env: env2, val: { tag: "int", value: left.value * right.value } };
                        case "/": return { env: env2, val: { tag: "int", value: left.value / right.value } };
                    }
                } else if (expr.op == "+" && left.tag == "string" && right.tag == "string") {
                    return { env: env2, val: { tag: "string", value: left.value + right.value } };
                } else if (expr.op == "*" && left.tag == "string" && right.tag == "int") {
                    return { env: env2, val: { tag: "string", value: left.value.repeat(right.value) } };
                } else {
                    throw Error(`Cannot use operation ${expr.op} between ${left.tag} and ${right.tag}`);
                }
            } else {
                if (!isComparible(left, right)) return { env: env2, val: { tag: "int", value: 0 } };
                switch (expr.op) {
                    case "==": return { env: env2, val: { tag: "int", value: +isEqual(left, right) } };
                    case "!=": return { env: env2, val: { tag: "int", value: +!isEqual(left, right) } };
                    case "<": return { env: env2, val: { tag: "int", value: +isLess(left, right) } };
                    case ">=": return { env: env2, val: { tag: "int", value: +!isLess(left, right) } };
                    case ">": return { env: env2, val: { tag: "int", value: +(!isLess(left, right) && !isEqual(left, right)) } };
                    case "<=": return { env: env2, val: { tag: "int", value: +(!isLess(left, right) || isEqual(left, right)) } };
                }
            }
            break; // TODO: ignore
        case "unary":
            const { env: newEnv, val: value } = evalExpression(pi, env, expr.expr);
            if (value.tag != "int") {
                throw Error(`Cannot use unary operator ${expr.op} on ${value.tag}`);
            }
            switch (expr.op) {
                case "-": return { env: newEnv, val: { tag: "int", value: -value.value } };
                case "!": return { env: newEnv, val: { tag: "int", value: +!value.value } };
            }
    }
}

function evalExpressionBody(pi: ProgramInfo, env: Environment, exprBody: SScope | Expression) {
    if (exprBody.tag !== "scope") evalExpression(pi, env, exprBody);
    else evalStatements(pi, env, exprBody.statements);
}

function evalIfStatement(pi: ProgramInfo, env: Environment, ifStatement: SIf): Environment {
    let unless: SUnless | undefined = ifStatement.unless;
    let run = ifStatement.run;

    while (true) {
        if (unless === undefined) {
            evalExpressionBody(pi, env, run);
            return env;
        }

        const cond = evalExpression(pi, env, unless.condition);
        env = cond.env;
        if (!toBoolean(cond.val)) {
            // Unless is false, we execute the code in run.
            evalExpressionBody(pi, env, run);
            return env;
        } else if (unless.then === undefined) {
            // We don't have any more "else if" statements
            return env;
        } else {
            run = unless.then.run;
            unless = unless.then.unless;
        }
    }
}

export function evalStatements(pi: ProgramInfo, env: Environment, statements: Array<Statement>) {
    for (const statement of statements) {
        switch (statement.tag) {
            case "noop": break;
            case "expr": env = evalExpression(pi, env, statement.expr).env; break;
            case "scope": evalStatements(pi, env, statement.statements); break;
            case "if": env = evalIfStatement(pi, env, statement); break;
            case "goto":
                const identifier = statement.identifier;
                const locations = pi.jumpTable.get(identifier);
                // This comment may not have been intended to be a come from location
                if (locations === undefined) break;
                const jl = locations[Math.floor(Math.random() * locations.length)];
                throw new GotoException(jl, env);
            default:
                assertUnreachable(statement);
        }
    }
}

export function evalSimple(pi: ProgramInfo, initialStatements: Array<Statement>) {
    let statements = initialStatements;
    let env = defaultEnv;

    while (true) {
        try {
            evalStatements(pi, env, statements);
        } catch (e: unknown) {
            if (e instanceof GotoException) {
                statements = e.jl.scope.slice(e.jl.numStatementsSkip);
                env = e.env;
                continue;
            } else {
                throw e;
            }
        }
        break;
    }
}

export function toString(value: Value): string {
    switch (value.tag) {
        case "internal_func": return `${value.name}(${value.args.join(", ")})`;
        case "func": return `${value.name}(${value.args.join(", ")})`;
        case "int": return `${value.value}`;
        case "string": return `${value.value}`;
        case "none": return "none";
    }
}

const internalFunctions: Array<[string, (args: Array<Value>) => Value]> = [
    ["print", args => {
        console.log(args.map(toString).join(" "));
        return { tag: "none" };
    }],
    ["mod", args => {
        assert(args.length === 2);
        assert(args[0].tag === "int");
        assert(args[1].tag === "int");
        return { tag: "int", value: args[0].value % args[1].value }
    }],
];

export const defaultEnv: IMap<string, Value> = IMap(
    internalFunctions.map(([name, func]): [string, Value] =>
        [name, { tag: "internal_func", name, args: [], func }]
    ).concat([
    ])
);
