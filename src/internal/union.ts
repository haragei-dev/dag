/**
 * Combines two sets into a new set.
 *
 * @param a - The first set.
 * @param b - The second set.
 * @return A new set that contains all elements from both input sets.
 */
export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
    if ('union' in a) {
        return a.union(b);
    }

    const result = new Set<T>(a);
    for (const item of b) {
        result.add(item);
    }

    return result;
}
