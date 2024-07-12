import assert from 'node:assert';
import { describe, it } from 'node:test';
import { union } from './union';

describe('union()', () => {
    it('should combine two sets into a new set', () => {
        const a = new Set([1, 2, 3]);
        const b = new Set([3, 4, 5]);

        const result = union(a, b);

        assert(result instanceof Set);
        assert.equal(result.size, 5);
        assert(result.has(1));
        assert(result.has(2));
        assert(result.has(3));
        assert(result.has(4));
        assert(result.has(5));
    });
});
