export class TLSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class TLNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
