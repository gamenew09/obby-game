export function printOutInterface<I>(int: I): void {
    // HACK: We know under the hood that an interface is just a table, and a table is just a Map<> in Typescript.
    //       So, let's just cast the interface to a Map.

    const interfaceHack: Map<unknown, unknown> = (int as unknown) as Map<unknown, unknown>;

    interfaceHack.forEach((val, key) => {
        print(`${key} = ${val}`); // TODO: recursive tables.
    });
}
