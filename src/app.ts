import { lex, stringifyTokens } from "./lexer";
import { parseStatements, stringifyAst } from "./parser";
import { Stack } from "./stack";

console.log("Hello World");
const tokens = lex("+(5);;print(53);");
console.log("Tokens:", stringifyTokens(tokens));
const stack = Stack.fromArrayFront(tokens);
const statements = parseStatements(stack);
console.log(stringifyAst(statements));
