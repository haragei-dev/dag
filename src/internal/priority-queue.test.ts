import assert from 'node:assert';
import { describe, it } from 'node:test';
import { PriorityQueue } from './priority-queue';

describe('PriorityQueue', () => {
    it('enqueues items maintaining the priority order', () => {
        const queue = new PriorityQueue<string>();

        queue.enqueue('B', 2);
        queue.enqueue('C', 3);
        queue.enqueue('E', 5);
        queue.enqueue('A', 1);
        queue.enqueue('D', 4);

        assert.deepStrictEqual([...queue], ['A', 'B', 'C', 'D', 'E']);
    });
});
