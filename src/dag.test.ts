import assert, { AssertionError } from 'node:assert';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { DAG } from './dag';

describe('DAG', () => {
    it('should create a new DAG', () => {
        const dag = new DAG();

        assert(dag instanceof DAG);
    });

    it('should create a new DAG with initial nodes', () => {
        const dag = new DAG(['A', 'B', 'C']);

        assert.equal(dag.has('A'), true);
        assert.equal(dag.has('B'), true);
        assert.equal(dag.has('C'), true);
    });

    it('should add a node to the DAG', () => {
        const dag = new DAG();
        dag.add('A');

        assert.equal(dag.has('A'), true);
        assert.equal(dag.has('B'), false);
        assert.equal(dag.has('C'), false);

        dag.add('B');
        dag.add('C');

        assert.equal(dag.has('A'), true);
        assert.equal(dag.has('B'), true);
        assert.equal(dag.has('C'), true);
        assert.equal(dag.has('D'), false);

        assert.equal(dag.size, 3);
    });

    it('should remove a node from the DAG', () => {
        const dag = new DAG(['A', 'B', 'C']);

        assert.equal(dag.has('A'), true);
        assert.equal(dag.has('B'), true);
        assert.equal(dag.has('C'), true);
        assert.equal(dag.size, 3);

        dag.delete('B');

        assert.equal(dag.has('A'), true);
        assert.equal(dag.has('B'), false);
        assert.equal(dag.has('C'), true);
        assert.equal(dag.size, 2);
    });

    it('should add an edge to the DAG', () => {
        const dag = new DAG(['A', 'B', 'C']);

        dag.addEdge('A', 'B');

        assert.equal(dag.hasEdge('A', 'B'), true);
        assert.equal(dag.hasEdge('B', 'A'), false);
        assert.equal(dag.hasEdge('A', 'C'), false);
        assert.equal(dag.hasEdge('C', 'A'), false);

        dag.addEdge('B', 'C');

        assert.equal(dag.hasEdge('A', 'B'), true);
        assert.equal(dag.hasEdge('B', 'C'), true);
        assert.equal(dag.hasEdge('A', 'C'), false);
        assert.equal(dag.hasEdge('C', 'A'), false);
    });

    it('should remove an edge from the DAG', () => {
        const dag = new DAG(['A', 'B', 'C']);

        dag.addEdge('A', 'B');
        dag.addEdge('B', 'C');

        assert.equal(dag.hasEdge('A', 'B'), true);
        assert.equal(dag.hasEdge('B', 'C'), true);

        dag.deleteEdge('A', 'B');

        assert.equal(dag.hasEdge('A', 'B'), false);
        assert.equal(dag.hasEdge('B', 'C'), true);
    });

    it('should prevent adding a cycle', () => {
        const dag = new DAG(['A', 'B', 'C']);

        dag.addEdge('A', 'B');
        dag.addEdge('B', 'C');

        assert.throws(
            () => {
                dag.addEdge('C', 'A');
            },
            {
                name: 'CycleError',
                message: 'Cycle detected',
            },
        );

        assert.equal(dag.hasEdge('C', 'A'), false);
    });

    it('should return a topological order of the DAG', () => {
        const dag = new DAG(['A', 'B', 'C', 'D', 'E']);

        const edges: [string, string][] = [
            ['A', 'B'],
            ['A', 'C'],
            ['B', 'D'],
            ['C', 'D'],
            ['D', 'E'],
        ];

        for (const [from, to] of edges) {
            dag.addEdge(from, to);
        }

        assertTopologicalOrder(edges, dag.order);
    });

    it('should return list of predecessors', () => {
        const dag = new DAG(['A', 'B', 'C', 'D', 'E']);

        const edges: [string, string][] = [
            ['A', 'C'],
            ['B', 'C'],
            ['C', 'D'],
            ['A', 'D'],
            ['D', 'E'],
            ['E', 'F'],
            ['B', 'F'],
            ['G', 'H'],
            ['H', 'I'],
            ['C', 'I'],
        ];

        for (const [from, to] of edges) {
            dag.addEdge(from, to);
            assert.equal(dag.hasEdge(from, to), true);
        }

        assertEqualElements(dag.getImmediatePredecessorsOf('D'), ['A', 'C']);
        assertEqualElements(dag.getImmediatePredecessorsOf('I'), ['C', 'H']);

        let ordered = Array.from(dag.getOrderedImmediatePredecessorsOf('D', 'I'));

        assertEqualElements(ordered, ['A', 'C', 'H']);
        assertTopologicalOrder(edges, ordered);

        assertEqualElements(dag.getPredecessorsOf('D'), ['A', 'B', 'C']);

        ordered = Array.from(dag.getOrderedPredecessorsOf('D', 'I'));

        assertEqualElements(ordered, ['A', 'B', 'C', 'H', 'G']);
        assertTopologicalOrder(edges, ordered);
    });

    it('should return list of successors', () => {
        const dag = new DAG(['A', 'B', 'C', 'D', 'E']);

        const edges: [string, string][] = [
            ['A', 'C'],
            ['B', 'C'],
            ['C', 'D'],
            ['A', 'D'],
            ['D', 'E'],
            ['E', 'F'],
            ['B', 'F'],
            ['G', 'H'],
            ['H', 'I'],
            ['C', 'I'],
        ];

        for (const [from, to] of edges) {
            dag.addEdge(from, to);
            assert.equal(dag.hasEdge(from, to), true);
        }

        assertEqualElements(dag.getImmediateSuccessorsOf('B'), ['C', 'F']);
        assertEqualElements(dag.getImmediateSuccessorsOf('C'), ['D', 'I']);

        let ordered = Array.from(dag.getOrderedImmediateSuccessorsOf('B', 'C'));

        assertEqualElements(ordered, ['D', 'F', 'I']);
        assertTopologicalOrder(edges, ordered);

        assertEqualElements(dag.getSuccessorsOf('C'), ['D', 'E', 'F', 'I']);

        ordered = Array.from(dag.getOrderedSuccessorsOf('H', 'A'));

        assertEqualElements(ordered, ['D', 'C', 'I', 'F', 'E']);
        assertTopologicalOrder(edges, ordered);
    });

    it('should incrementally update the topological order', async (t) => {
        const fixtures = await loadFixtures<{
            nodes: string[];
            edges: [string, string][];
        }>();

        await Promise.all(
            Array.from(fixtures.keys()).map((name) => {
                const { nodes, edges } = fixtures.get(name)!;

                return t.test(`${name} (${nodes.length} nodes, ${edges.length} edges)`, () => {
                    const graph = new DAG<string>();

                    for (const node of nodes) {
                        graph.add(node);
                        assert.equal(graph.has(node), true);
                    }

                    const addedEdges: [string, string][] = [];

                    for (const [from, to] of edges) {
                        graph.addEdge(from, to);
                        assert.equal(graph.hasEdge(from, to), true);

                        addedEdges.push([from, to]);

                        assertTopologicalOrder(
                            addedEdges,
                            graph.order,
                            `(inserting edge ${from} -> ${to})`,
                        );
                    }

                    const { order } = graph;

                    assert.equal(order.length, nodes.length);
                });
            }),
        );
    });

    it('should decrementally update the topological order', () => {
        const graph = new DAG<string>();

        graph.addEdge('A', 'B');
        graph.addEdge('A', 'D');
        graph.addEdge('B', 'C');
        graph.addEdge('A', 'E');
        graph.addEdge('E', 'F');
        graph.addEdge('D', 'C');
        graph.addEdge('D', 'F');
        graph.addEdge('C', 'F');

        assertTopologicalOrder(
            [
                ['A', 'B'],
                ['A', 'D'],
                ['B', 'C'],
                ['A', 'E'],
                ['E', 'F'],
                ['D', 'C'],
                ['D', 'F'],
                ['C', 'F'],
            ],
            graph.order,
        );

        graph.deleteEdge('D', 'C');
        graph.deleteEdge('A', 'F');

        assertTopologicalOrder(
            [
                ['A', 'B'],
                ['A', 'D'],
                ['B', 'C'],
                ['A', 'E'],
                ['D', 'F'],
                ['C', 'F'],
                ['E', 'F'],
            ],
            graph.order,
        );

        graph.delete('D');

        assertTopologicalOrder(
            [
                ['A', 'B'],
                ['B', 'C'],
                ['A', 'E'],
                ['C', 'F'],
            ],
            graph.order,
        );

        assertTopologicalOrder(
            [
                ['A', 'C'],
                ['B', 'C'],
                ['A', 'E'],
                ['C', 'F'],
            ],
            Array.from(graph.getOrderedPredecessorsOf('C', 'E', 'A', 'X', 'Y')),
        );
    });

    it('should merge nodes', () => {
        //
        // A -> B -> C
        // D -> E -> F
        //
        // "merge" E into B:
        //
        // A >-+   +-> C
        //	    \ /
        //       B
        //      / \
        // D >-+   +-> F
        //
        const graph = new DAG<string>();

        graph.addEdge('A', 'B');
        graph.addEdge('B', 'C');
        graph.addEdge('D', 'E');
        graph.addEdge('E', 'F');

        assertEqualElements(graph.order, ['A', 'B', 'C', 'D', 'E', 'F']);
        assertTopologicalOrder(
            [
                ['A', 'B'],
                ['B', 'C'],
                ['D', 'E'],
                ['E', 'F'],
            ],
            graph.order,
        );

        graph.mergeNodes('B', 'E');

        assertEqualElements(graph.order, ['A', 'B', 'C', 'D', 'F']);
        assertTopologicalOrder(
            [
                ['A', 'B'],
                ['B', 'C'],
                ['D', 'B'],
                ['B', 'F'],
            ],
            graph.order,
        );

        graph.mergeNodes('X', 'B'); // no node X

        // nothing changed:
        assertEqualElements(graph.order, ['A', 'B', 'C', 'D', 'F']);
        assertTopologicalOrder(
            [
                ['A', 'B'],
                ['B', 'C'],
                ['D', 'B'],
                ['B', 'F'],
            ],
            graph.order,
        );

        graph.addEdge('G', 'H');
        graph.addEdge('H', 'B');

        assertEqualElements(graph.order, ['A', 'B', 'C', 'D', 'F', 'G', 'H']);
        assertTopologicalOrder(
            [
                ['A', 'B'],
                ['B', 'C'],
                ['D', 'B'],
                ['B', 'F'],
                ['G', 'H'],
                ['H', 'B'],
            ],
            graph.order,
        );

        //
        // merging F and G should fail (would cycle through B)
        //
        // A >-+   +-> C
        //	    \ /
        //       B <- H <- G
        //      / \
        // D >-+   +-> F
        //

        assert.throws(
            () => {
                graph.mergeNodes('F', 'G');
            },
            {
                name: 'CycleError',
                message: 'Cycle detected',
            },
        );

        // nothing changed:
        assertEqualElements(graph.order, ['A', 'B', 'C', 'D', 'F', 'G', 'H']);
        assertTopologicalOrder(
            [
                ['A', 'B'],
                ['B', 'C'],
                ['D', 'B'],
                ['B', 'F'],
                ['G', 'H'],
                ['H', 'B'],
            ],
            graph.order,
        );
    });
});

function assertTopologicalOrder<T>(edges: Iterable<[T, T]>, order: T[], message = ''): void {
    const indices = new Map<T, number>();

    for (let i = 0; i < order.length; i++) {
        indices.set(order[i]!, i);
    }

    for (const [from, to] of edges) {
        const fromOrder = indices.get(from);
        const toOrder = indices.get(to);

        if (fromOrder === undefined || toOrder === undefined) {
            continue;
        }

        if (fromOrder >= toOrder) {
            throw new AssertionError({
                message: `Expected ${String(from)} to come before ${String(to)} in a topological order. ${message}`,
                actual: [
                    { from, order: fromOrder },
                    { to, order: toOrder },
                ],
                expected: [
                    { from, order: fromOrder },
                    { to, order: `>= ${fromOrder + 1}` },
                ],
            });
        }
    }
}

function assertEqualElements<T>(a: Iterable<T>, b: Iterable<T>): void {
    const actual = new Set(a);
    const expected = new Set(b);

    if (actual.size !== expected.size || actual.union(expected).size !== actual.size) {
        throw new AssertionError({
            message: 'Expected the same elements',
            actual,
            expected,
        });
    }
}

async function loadFixtures<T>(
    dirname = join(import.meta.dirname, '../fixtures'),
): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    for (const entry of await readdir(dirname, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) {
            continue;
        }

        const data = await readFile(join(dirname, entry.name), 'utf8');
        result.set(entry.name, JSON.parse(data) as T);
    }

    return result;
}
