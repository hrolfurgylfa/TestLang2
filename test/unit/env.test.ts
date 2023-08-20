import { Environment } from "../../src/env";

let env = undefined as unknown as Environment
let env2 = undefined as unknown as Environment
beforeEach(() => {
    env = new Environment([
        ["a", { tag: "string", value: "hello" }],
        ["b", { tag: "string", value: "world" }],
        ["c", { tag: "int", value: 42 }],
    ]);
    env2 = env.set("d", { tag: "int", value: 1 });
});

test("Fetching from single environment works", () => {
    expect(env.get("1")).toBeUndefined();
    expect(env.get("d")).toBeUndefined();
    expect(env.get("a")).toStrictEqual({ tag: "string", value: "hello" });
    expect(env.get("b")).toStrictEqual({ tag: "string", value: "world" });
    expect(env.get("c")).toStrictEqual({ tag: "int", value: 42 });
});

test("Fetching from child environment works", () => {
    expect(env2.get("e")).toBeUndefined();
    expect(env2.get("d")).toStrictEqual({ tag: "int", value: 1 });
    expect(env2.get("c")).toStrictEqual({ tag: "int", value: 42 });
});