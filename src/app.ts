import { evalSimple } from "./evaluator";
import { lex, stringifyTokens } from "./lexer";
import { parseStatements, stringifyAst } from "./parser";
import { TokenConsumer } from "./token_consumer";
import fs from "fs";

import { program as commander } from "commander";

commander
    .name('testlang2')
    .description('An interpreter for a silly test language written in TypeScript.')
    .version('0.1.0')
    .argument("<input-file>")
    .option('--verbose', 'Display a lot of debugging information along with the output of the program.')
    .action((inputFile: string, options: { verbose: boolean }) => {
        console.log(inputFile);
        const program = fs.readFileSync(inputFile).toString();
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
        const statements = parseStatements(consumer);
        if (options.verbose) {
            console.log("Program from AST:");
            console.log(stringifyAst(statements));
            console.log("-".repeat(50));
            console.log("Program output:");
        }
        evalSimple(statements);
    });

commander.parse();
