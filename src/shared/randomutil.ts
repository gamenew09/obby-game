export function pickRandomElementFromArray<T>(arr: T[]): T {
    return arr[math.random(0, arr.size() - 1)];
}
