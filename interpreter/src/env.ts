import { Value } from "./evaluator";

export class Environment {
    parent: Environment | undefined
    variables: Array<[string, Value]>

    constructor(initial: Array<[string, Value]>, parent?: Environment) {
        this.parent = parent;
        this.variables = initial;
    }

    getFull(name: string): {val: Value, instance: Environment} | undefined {
        for (let i = 0; i < this.variables.length; i++) {
            if (this.variables[i][0] === name) {
                return { val: this.variables[i][1], instance: this }
            }
        }

        return this.parent?.getFull(name);
    }

    setOnInstance(name: string, val: Value) {
        let found = false;
        for (let i = 0; i < this.variables.length; i++) {
            if (this.variables[i][0] === name) {
                this.variables[i][1] = val;
                found = true;
                break;
            }
        }
        if (!found) this.variables.push([name, val]);
    }

    public get(name: string): Value | undefined {
        return this.getFull(name)?.val;
    }

    public set(name: string, val: Value): Environment {
        const found = this.getFull(name);
        if (found === undefined) {
            return new Environment([[name, val]], this);
        } else {
            found.instance.setOnInstance(name, val);
            return this;
        }
    }
}