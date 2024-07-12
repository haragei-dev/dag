/**
 * Error thrown when a cycle would be introduced in a DAG.
 */
export class CycleError extends Error {
    public constructor() {
        super('Cycle detected');
        this.name = 'CycleError';
    }
}
