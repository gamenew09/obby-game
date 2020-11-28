export function InstanceAs<T extends keyof Instances>(
    instance: Instance,
    isA: T,
    assertMessage?: string,
): Instances[T] {
    if (instance.IsA(isA)) {
        return instance;
    } else {
        error(assertMessage ?? `Could not cast instance to be of type ${isA}.`);
    }
}
