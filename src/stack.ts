export class Stack<T> {
    private data: Array<T>;
    constructor(array: T[]) {
        this.data = array;
    }

    static fromArrayFront<T>(array: T[]): Stack<T> {
        array.reverse();
        return new this(array);
    }

    peek(): T | undefined { return this.data[this.data.length - 1]; }
    pop(): T | undefined { return this.data.pop(); }
    push(...items: T[]) { this.data.push(...items); }
}
