export type FullToken = { token: Token, loc: Location }
export type Location = { line: number, column: number }
export type Token =
    | { tag: "comparison", op: "<" | ">" | "<=" | ">=" }
    | { tag: "equality", reverse: boolean }
    | { tag: "identifier", value: string }
    | { tag: "int", value: number }
    | { tag: "semicolon" }
    | { tag: "comma" }
    | { tag: "lbracket" }
    | { tag: "rbracket" }
    | { tag: "curlylbracket" }
    | { tag: "curlyrbracket" }
    | { tag: "assign" }
    | { tag: "true" }
    | { tag: "false" }
    | { tag: "eof" }
    | { tag: "add" }
    | { tag: "subtract" }
    | { tag: "multiply" }
    | { tag: "divide" }
    | { tag: "bang" }
    | { tag: "unless" }
    | { tag: "then" }

type SubLexerOutput = { token: FullToken, newPos: number }

function isIdentifierChar(char: string): boolean {
    const n = char.charCodeAt(0);
    const isAscii = (n >= 65 && n < 91) || (n >= 97 && n < 123);
    return isAscii || RegExp(/^\p{L}/, "u").test(char);
}

function isNumber(char: string): boolean {
    return parseNumber(char) != -1;
}

/**
 * Returns -1 if the char is not a number or the number from 0 - 9 if the char is a number.
 */
function parseNumber(char: string): number {
    const n = char.charCodeAt(0);
    const isNumber = n >= 48 && n < 58;
    if (isNumber) {
        return n - 48;
    } else {
        return -1;
    }
}

function lexIdentifier(program: string, pos: number, count: (s: string) => Location): SubLexerOutput {
    let identifier = "";
    for (; pos < program.length; pos++) {
        const currChar = program[pos];
        if (isIdentifierChar(currChar) || isNumber(currChar)) {
            identifier += currChar;
        } else {
            break;
        }
    }

    const loc = count(identifier);
    let token: Token;
    switch (identifier) {
        case "true": token = { tag: "true" }; break;
        case "false": token = { tag: "false" }; break;
        case "unless": token = { tag: "unless" }; break;
        case "then": token = { tag: "then" }; break;
        default:
            token = { tag: "identifier", value: identifier };
    }

    return { token: { token, loc }, newPos: pos };
}

function lexNumber(program: string, pos: number, count: (s: string) => Location): SubLexerOutput {
    let number = 0;
    for (; pos < program.length; pos++) {
        const currChar = program[pos];
        const parsed = parseNumber(currChar);
        if (parsed != -1) {
            number *= 10;
            number += parsed;
        } else {
            break;
        }
    }

    const loc = count(number.toString());
    const token: FullToken = { token: { tag: "int", value: number }, loc }
    return { token, newPos: pos };
}

function countLocation(loc: Location, symbol: string): Location {
    const locCopy = { ...loc };
    const numEnter = (symbol.match(/\n/g) || []).length;
    if (numEnter == 0) {
        loc.column += symbol.length;
    } else {
        loc.line += numEnter;
        loc.column = symbol.length - (symbol.lastIndexOf("\n"));
    }

    return locCopy;
}

function match(program: string, i: number, target: string): boolean {
    return program.slice(i, i + target.length) === target;
}

export function lex(program: string): FullToken[] {
    const tokens: FullToken[] = [];
    let loc = { line: 1, column: 1 };
    let count = (s: string) => countLocation(loc, s);
    let symbols: Array<[string, null | Token]> = [
        ["==", { tag: "equality", reverse: false }],
        ["!=", { tag: "equality", reverse: true }],
        ["<", { tag: "comparison", op: "<" }],
        [">", { tag: "comparison", op: ">" }],
        ["<=", { tag: "comparison", op: "<=" }],
        [">=", { tag: "comparison", op: ">=" }],
        [" ", null],
        ["\n", null],
        ["\t", null],
        ["\r", null],
        [";", { tag: "semicolon" }],
        [",", { tag: "comma" }],
        ["(", { tag: "lbracket" }],
        [")", { tag: "rbracket" }],
        ["{", { tag: "curlylbracket" }],
        ["}", { tag: "curlyrbracket" }],
        ["=", { tag: "assign" }],
        ["+", { tag: "add" }],
        ["-", { tag: "subtract" }],
        ["*", { tag: "multiply" }],
        ["/", { tag: "divide" }],
    ];
    nextChar: for (let i = 0; i < program.length;) {
        for (let j = 0; j < symbols.length; j++) {
            const [symbol, token] = symbols[j];
            if (match(program, i, symbol)) {
                i += symbol.length;
                const loc = count(symbol);
                if (token !== null) tokens.push({ token, loc });
                continue nextChar;
            }
        }
        if (isNumber(program[i])) {
            const { token, newPos } = lexNumber(program, i, count);
            tokens.push(token); i = newPos; continue;
        }
        if (isIdentifierChar(program[i])) {
            const { token, newPos } = lexIdentifier(program, i, count);
            tokens.push(token); i = newPos; continue;
        }
        throw Error(`Unknown character \"${program[i]}\" at position ${i}`);
    }

    tokens.push({ token: { tag: "eof" }, loc });
    return tokens;
}

export function stringifyToken(token: Token | undefined): string {
    if (token == undefined) return "undefined";

    let extra: string;
    switch (token.tag) {
        case "identifier": extra = token.value; break;
        case "int": extra = token.value.toString(); break;
        default: extra = ""; break;
    }

    if (extra != "") extra = `(${extra})`;
    return token.tag + extra;
}

export function stringifyTokens(tokens: Array<Token>): string {
    return "[" + tokens.map(stringifyToken).join(", ") + "]";
}
