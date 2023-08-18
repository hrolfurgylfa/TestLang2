import { Environment } from "./evaluator";
import { JumpLocation } from "./parser";

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

export class GotoException extends Error {
  jl: JumpLocation
  env: Environment

  constructor(jl: JumpLocation, env: Environment) {
    super("GotoException");
    this.name = this.constructor.name;

    this.jl = jl;
    this.env = env;
  }
}
