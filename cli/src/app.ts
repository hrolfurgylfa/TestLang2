import fs from "fs";

import { program as commander } from "commander";
import { execute } from "interpreter";

commander
    .name('testlang2')
    .description('An interpreter for a silly test language written in TypeScript.')
    .version('0.1.0')
    .argument("[input-file]")
    .option("-e, --execute <code>", "The code to execute, can be used instead of providing a file with code.")
    .option('-v, --verbose', 'Display a lot of debugging information along with the output of the program.')
    .action((inputFile: string | undefined, options: { verbose: boolean, execute: string | undefined }) => {

        // Get the code to run
        if (inputFile !== undefined && options.execute !== undefined) {
            console.log(
                "error: only a file *or* --execute can be specified.",
                "Providing both gives ambiguity in which one should be used.");
            process.exit(101);
        }
        let program: string;
        if (inputFile !== undefined) {
            program = fs.readFileSync(inputFile).toString();
        } else if (options.execute !== undefined) {
            program = options.execute;
        } else {
            console.log("error: neither a file was given to run nor was -e/--execute used to specify code through command line arguments.");
            process.exit(102);
        }

        // Run the program
        execute(program, { verbose: options.verbose });
    });

commander.parse();