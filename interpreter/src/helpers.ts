export function assertUnreachable(_: never): never {
    throw new Error("Didn't expect to get here");
}

export function assert(value: unknown): asserts value {
    if (value) return;

    throw new Error(`Assert failed: ${value}`);
}
