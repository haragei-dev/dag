import assert from 'node:assert';
import { describe, it } from 'node:test';
import { byValue, byOrder } from './order';
import type { Node } from './node';

describe('byValue()', () => {
    it('returns negative number if first number is less than the second', () => {
        assert.equal(byValue(1, 2), -1);
        assert.equal(byValue(0, 1), -1);
        assert.equal(byValue(-1, 0), -1);
        assert.equal(byValue(-Infinity, Infinity), -1);
    });
    it('returns positive number if first number is greater than the second', () => {
        assert.equal(byValue(2, 1), 1);
        assert.equal(byValue(1, 0), 1);
        assert.equal(byValue(0, -1), 1);
        assert.equal(byValue(Infinity, -Infinity), 1);
    });
    it('returns zero if numbers are equal', () => {
        assert.equal(byValue(0, 0), 0);
        assert.equal(byValue(1, 1), 0);
        assert.equal(byValue(-1, -1), 0);
        assert.equal(byValue(Infinity, Infinity), 0);
    });
});

describe('byOrder()', () => {
    it('returns negative number if the first node should be ordered before the second', () => {
        const lhs = { order: 1 } as Node<number>;
        const rhs = { order: 2 } as Node<number>;
        assert.equal(byOrder(lhs, rhs), -1);
    });
    it('returns positive number if the first node should be ordered after the second', () => {
        const lhs = { order: 2 } as Node<number>;
        const rhs = { order: 1 } as Node<number>;
        assert.equal(byOrder(lhs, rhs), 1);
    });
    it('returns zero if nodes have the same order', () => {
        const lhs = { order: 0 } as Node<number>;
        const rhs = { order: 0 } as Node<number>;
        assert.equal(byOrder(lhs, rhs), 0);
    });
});
