/**
 * A simple priority queue based on a sorted array.
 */
export class PriorityQueue<T> {
    #data: T[];
    #priorities: number[];

    /**
     * Creates a new, empty priority queue.
     */
    public constructor() {
        this.#data = [];
        this.#priorities = [];
    }

    /**
     * Enqueues an item with the given priority.
     *
     * The priority is in ascending order, where lower values have higher priority.
     *
     * @param item - Item to insert to the queue.
     * @param priority - Item priority to use to re-prioritize the queue.
     */
    public enqueue(item: T, priority: number): void {
        const { length } = this.#data;

        this.#data.push(item);
        this.#priorities.push(priority);

        if (length > 0 && this.#priorities[length - 1]! > priority) {
            let lo = 0,
                hi = length;

            while (lo < hi) {
                const mid = lo + Math.trunc((hi - lo) / 2);
                if (this.#priorities[mid]! < priority) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }

            if (lo < length) {
                this.#data.copyWithin(lo + 1, lo, length);
                this.#data[lo] = item;

                this.#priorities.copyWithin(lo + 1, lo, length);
                this.#priorities[lo] = priority;
            }
        }
    }

    /**
     * Returns iterator over all queue items in priority order.
     *
     * @returns Queue item iterator in priority order.
     */
    [Symbol.iterator](): Iterator<T> {
        return this.#data[Symbol.iterator]();
    }

    /**
     * Returns an array containing all queue items in priority order.
     *
     * @return Queue items in priority order.
     */
    public toArray(): T[] {
        return this.#data.slice(0);
    }
}
