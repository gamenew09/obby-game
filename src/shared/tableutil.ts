export function copyInterface<I>(i: I): I {
    // HACK: We know under the hood that an interface is just a table, and a table is just a Map<> in Typescript.
    //       So, let's just cast the interface to a Map.

    const interfaceHack: Map<unknown, unknown> = (i as unknown) as Map<unknown, unknown>;

    const newInterface: Map<unknown, unknown> = new Map<unknown, unknown>();

    interfaceHack.forEach((val, key) => {
        newInterface.set(key, val);
    });

    return (newInterface as unknown) as I;
}

export function arrayHas(arr: Array<unknown>, val: unknown): boolean {
    for (const v of arr) {
        if (v === val) {
            return true;
        }
    }
    return false;
}
