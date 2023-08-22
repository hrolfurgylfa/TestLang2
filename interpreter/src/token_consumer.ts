import { TLSyntaxError } from "./errors";
import { FullToken, Location, Token } from "./lexer"

export class TokenConsumer {
    private tokens: Array<FullToken>;
    private current: number;
    constructor(tokens: Array<FullToken>) {
        this.tokens = tokens;
        this.current = 0;
    }

    peekFull(): FullToken {
        return this.tokens[this.current];
    }

    peek(): Token {
        return this.peekFull().token;
    }

    isAtEnd(): boolean {
        return this.peek().tag == "eof";
    }

    previousFull(): FullToken {
        return this.tokens[this.current - 1];
    }

    previous(): Token {
        return this.previousFull().token;
    }

    previousLoc(): Location {
        return this.previousFull().loc;
    }

    check(tag: Token["tag"]): boolean {
        if (this.isAtEnd()) return false;
        const current = this.peek();
        return current.tag == tag;
    }

    advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    match<Tag extends Token["tag"]>(tag: Tag): Extract<Token, { tag: Tag }> | undefined {
        return this.matchMul(tag) as Extract<Token, { tag: Tag }> | undefined;
    }

    matchMul(...tags: Array<Token["tag"]>): Token | undefined {
        for (const tag of tags) {
            if (this.check(tag)) {
                this.advance();
                return this.previous();
            }
        }

        return undefined;
    }

    errExpected(expected: string, options?: { peek?: boolean }): never {
        const defaultOpt = { peek: false };
        const opt = { ...defaultOpt, ...options } || defaultOpt
        const { token, loc } = opt.peek ? this.peekFull() : this.previousFull();
        throw new TLSyntaxError(
            `Expected ${expected} but found ${token.tag} instead.` +
            `\n\nLine: ${loc.line}, Column: ${loc.column}.`);
    }


    consume<Tag extends Token["tag"]>(tag: Tag): Extract<Token, { tag: Tag }> {
        const token = this.matchMul(tag) as Extract<Token, { tag: Tag }>;
        if (token === undefined) this.errExpected(tag);
        return token;
    }
}
