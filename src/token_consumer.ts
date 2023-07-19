import { Token } from "./lexer"

export class TokenConsumer {
    private tokens: Array<Token>;
    private current: number;
    constructor(tokens: Array<Token>) {
        this.tokens = tokens;
        this.current = 0;
    }

    peek(): Token {
        return this.tokens[this.current];
    }

    isAtEnd(): boolean {
        return this.peek().tag == "eof";
    }

    previous(): Token {
        return this.tokens[this.current - 1];
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
}
