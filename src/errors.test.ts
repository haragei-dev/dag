import assert from 'node:assert';
import { describe, it } from 'node:test';
import { CycleError } from './errors';

describe('CycleError', () => {
    it('has "Cycle detected" message', () => {
        const error = new CycleError();

        assert.equal(error.message, 'Cycle detected');
    });
    it('has "CycleError" name', () => {
        const error = new CycleError();

        assert.equal(error.name, 'CycleError');
    });
});
