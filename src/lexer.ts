type Identifier = { tag: "identifier", value: string }
type Int = { tag: "int", value: number }
type Semicolon = { tag: "semicolon" }
type Comma = { tag: "comma" }
type LBracket = { tag: "lbracket" }
type RBracket = { tag: "rbracket" }
type CurlyLBracket = { tag: "curlylbracket" }
type CurlyRBracket = { tag: "curlyrbracket" }
type Assign = { tag: "assign" }
type True = { tag: "true" }
type False = { tag: "false" }
type Token = Identifier | Int | Semicolon | Comma | LBracket | RBracket | CurlyLBracket | CurlyRBracket | Assign | True | False

type SubLexerOutput = { token: Token, newPos: number }

const extraIdentifiers = ["+", "*", "-", "/"];

function isIdentifierChar(char: string): boolean {
    const n = char.charCodeAt(0);
    const isAscii = (n >= 65 && n < 91) || (n >= 97 && n < 123);
    return isAscii || extraIdentifiers.includes(char) || RegExp(/^\p{L}/, "u").test(char);
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

function lexIdentifier(program: string, pos: number): SubLexerOutput {
    let identifier = "";
    for (; pos < program.length; pos++) {
        const currChar = program[pos];
        if (isIdentifierChar(currChar) || isNumber(currChar)) {
            identifier += currChar;
        } else {
            break;
        }
    }

    let token: Token;
    switch (identifier) {
        case "true": token = { tag: "true" }; break;
        case "false": token = { tag: "false" }; break;
        default:
            token = { tag: "identifier", value: identifier };
    }

    return { token, newPos: pos };
}

function lexNumber(program: string, pos: number): SubLexerOutput {
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

    return { token: { tag: "int", value: number }, newPos: pos };
}


export function lex(program: string): Token[] {
    const tokens: Token[] = [];
    for (let i = 0; i < program.length; i++) {
        const currChar = program[i];
        switch (currChar) {
            case " ":
            case "\n":
            case "\t":
            case "\r": continue;
            case ";": tokens.push({ tag: "semicolon" }); continue;
            case ",": tokens.push({ tag: "comma" }); continue;
            case "(": tokens.push({ tag: "lbracket" }); continue;
            case ")": tokens.push({ tag: "rbracket" }); continue;
            case "{": tokens.push({ tag: "curlylbracket" }); continue;
            case "}": tokens.push({ tag: "curlyrbracket" }); continue;
            case "=": tokens.push({ tag: "assign" }); continue;
            default:
                if (isNumber(currChar)) {
                    const { token, newPos } = lexNumber(program, i);
                    tokens.push(token); i = newPos - 1; continue;
                }
                if (isIdentifierChar(currChar)) {
                    const { token, newPos } = lexIdentifier(program, i);
                    tokens.push(token); i = newPos - 1; continue;
                }
        }
        throw Error(`Unknown character ${currChar} at position ${i}`);
    }
    return tokens;
}
