import { execute } from "../src/app";
import fs from "fs";

test.each([
    ["hello_world", "Hello World\n"],
    ["count", "1\n2\n3\n4\n5\n6\n"],
    ["comments", "1\n2\n3\n"],
    ["1", "-9\n42\n"],
    ["2", "42\n44\n"],
    ["fizzbuzz", [...Array(99).keys()].map(i=>((i+1)%3==0?"Fizz":"")+((i+1)%5==0?"Buzz":"")||(i+1+"")).join("\n") + "\n"],
])(
    "Testlang program %i gives correct output",
    (programName, expectedOutput) => {
        const filePath = `tstl/${programName}.tstl`;
        const program = fs.readFileSync(filePath).toString();

        // Capture stdout
        let stdout = "";
        const prevConsoleLog = console.log;
        console.log = (...args) => {
            stdout += args.join(" ") + "\n";
        }

        execute(program);

        // Stop capturing stdout
        console.log = prevConsoleLog;

        expect(stdout).toBe(expectedOutput);
    },
);
