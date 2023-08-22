import { evalSimple } from "./evaluator";
import { lex, stringifyTokens } from "./lexer";
import { parseStatements, stringifyAst } from "./parser";
import { TokenConsumer } from "./token_consumer";

type RunOptions = { verbose?: boolean };

export function execute(program: string, opt?: RunOptions) {
    const defaultOpt = { verbose: false };
    const options = { ...defaultOpt, ...opt }

    if (options.verbose) {
        console.log("Program:");
        console.log(program);
        console.log("-".repeat(50));
    }
    const tokens = lex(program);
    if (options.verbose) {
        console.log("Tokens:");
        console.log(stringifyTokens(tokens.map(ft => ft.token)));
        console.log("-".repeat(50));
    }
    const consumer = new TokenConsumer(tokens);
    const programInfo = { jumpTable: new Map() };
    const statements = parseStatements(programInfo, consumer);
    if (options.verbose) {
        console.log("Program from AST:");
        console.log(stringifyAst(statements));
        console.log("-".repeat(50));
        console.log("Program output:");
    }
    evalSimple(programInfo, statements);
}
