import { evalSimple } from "./evaluator";
import { lex, stringifyTokens } from "./lexer";
import { parseStatements, stringifyAst } from "./parser";
import { TokenConsumer } from "./token_consumer";

console.log("Hello World");
const tokens = lex("print(print(3 + 3 * -4));;print(42);");
console.log("Tokens:", stringifyTokens(tokens));
const consumer = new TokenConsumer(tokens);
const statements = parseStatements(consumer);
console.log(stringifyAst(statements));
evalSimple(statements);
