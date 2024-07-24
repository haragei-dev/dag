import { CycleError } from './errors';
import type { Node } from './internal/node';
import { byOrder, byValue } from './internal/order';
import { PriorityQueue } from './internal/priority-queue';
import { union } from './internal/union';

/**
 * A Directed Acyclic Graph structure with online cycle detection and topological ordering.
 */
export class DAG<T> {
    /**
     * The internal state of the graph.
     */
    #nodes: Map<T, Node<T>>;

    /**
     * a topological order of the nodes in the graph.
     */
    #order: T[];

    /**
     * Creates a new DAG with optional initial nodes.
     *
     * @param initialNodes - An optional iterable of initial nodes to populate the graph with.
     */
    public constructor(initialNodes?: Iterable<T>) {
        this.#nodes = new Map();
        this.#order = [];

        if (initialNodes) {
            for (const node of initialNodes) {
                this.#ensureNodeExists(node);
            }
        }
    }

    /**
     * Returns a list of all nodes in the graph in a topological order.
     *
     * **Note:** for every `U -> V` directed edge, `U` will appear
     * before `V` in a topological order.
     *
     * @return An array of all graph nodes in a topological order.
     */
    public get order(): T[] {
        return this.#order.slice(0);
    }

    /**
     * Returns the number of nodes in the graph.
     *
     * @return Number of nodes in the graph
     */
    public get size(): number {
        return this.#nodes.size;
    }

    /**
     * Iterates over all nodes in the graph in a topological order.
     *
     * @alias keys
     * @return An iterator over all nodes in the graph.
     */
    [Symbol.iterator](): IterableIterator<T> {
        return this.#order[Symbol.iterator]();
    }

    /**
     * Iterates over all nodes in the graph in a topological order.
     *
     * @return An iterator over all nodes in the graph.
     */
    keys(): IterableIterator<T> {
        return this.#order[Symbol.iterator]();
    }

    /**
     * Creates a new, independent copy of this DAG.
     *
     * @return Clone of this DAG.
     */
    public copy(): DAG<T> {
        const clone = new DAG<T>();

        clone.#order = this.#order.slice(0);
        clone.#nodes = new Map();

        for (const [id, node] of this.#nodes) {
            clone.#nodes.set(id, {
                id,
                order: node.order,
                incoming: new Set(node.incoming),
                outgoing: new Set(node.outgoing),
            });
        }

        return clone;
    }

    /**
     * Removes all nodes (and their edges) from the graph.
     *
     * @return This DAG.
     */
    public clear(): this {
        this.#nodes.clear();
        this.#order.splice(0, this.#order.length);
        return this;
    }

    /**
     * Adds a node to the graph.
     * If the node already exists, this is a no-op.
     *
     * @param node - The node to add.
     * @return This DAG.
     */
    public add(node: T): this {
        this.#ensureNodeExists(node);
        return this;
    }

    /**
     * Checks if a specific node exists in the graph.
     *
     * @param node - The node to check.
     * @return `true` if the node exists, `false` otherwise.
     */
    public has(node: T): boolean {
        return this.#nodes.has(node);
    }

    /**
     * Removes a specified node from the graph.
     * If such node doesn't exist, this is a no-op.
     *
     * **Note:** This also removes all edges from or to the specified node.
     *
     * @param node - The node to remove.
     * @return This DAG.
     */
    public delete(node: T): this {
        const state = this.#nodes.get(node);

        if (state) {
            const index = state.order;
            const last = this.#order.length - 1;

            for (let i = index; i < last; i++) {
                this.#order[i] = this.#order[i + 1]!;
                this.#nodes.get(this.#order[i]!)!.order = i;
            }

            this.#order.pop();

            for (const id of state.incoming) {
                this.#nodes.get(id)!.outgoing.delete(node);
            }
            for (const id of state.outgoing) {
                this.#nodes.get(id)!.incoming.delete(node);
            }

            this.#nodes.delete(node);
        }

        return this;
    }

    /**
     * Tries to add a directed edge to the graph.
     *
     * If any of the nodes doesn't already exist, it will be added.
     *
     * If inserting the given edge would introduce a cycle no changes
     * are made to the graph and CycleError is thrown.
     *
     * Adding an edge from a node to that same node (i.e. `from` and `to` are
     * the same) is considered a cycle and such edge cannot be added.
     *
     * @param from - The "source" node.
     * @param to - The "target" node.
     * @return This DAG.
     */
    public addEdge(from: T, to: T): this {
        if (from == to) {
            throw new CycleError();
        }

        this.#addEdge(from, to);

        return this;
    }

    /**
     * Tries to add a directed edge to the graph.
     *
     * If any of the nodes doesn't already exist, it will be added.
     *
     * If inserting the given edge would introduce a cycle no changes
     * are made to the graph and `false` is returned.
     *
     * Adding an edge from a node to that same node (i.e. `from` and `to` are
     * the same) is considered a cycle and such edge cannot be added.
     *
     * @param from - The "source" node.
     * @param to - The "target" node.
     * @return `true` if the edge was added, `false` otherwise.
     */
    public tryAddEdge(from: T, to: T): boolean {
        try {
            this.addEdge(from, to);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Checks if a specific (directed) edge exists in the graph.
     *
     * @param from - The "source" node.
     * @param to - The "target" node.
     * @return `true` if the edge exists, `false` otherwise.
     */
    public hasEdge(from: T, to: T): boolean {
        const node = this.#nodes.get(from);
        return node !== undefined && node.outgoing.has(to);
    }

    /**
     * Removes a specified edge from the graph.
     * If such edge doesn't exist, this is a no-op.
     *
     * **Note:** this removes a directed edge. If an edge A -> B exists,
     * it will not be removed with a removeEdge(B, A) call.
     *
     * @param from - The "source" node.
     * @param to - The "target" node.
     * @return This DAG.
     */
    public deleteEdge(from: T, to: T): this {
        if (this.hasEdge(from, to)) {
            this.#nodes.get(from)!.outgoing.delete(to);
            this.#nodes.get(to)!.incoming.delete(from);
        }

        return this;
    }

    /**
     * Removes all outgoing edges from a given node.
     * If such node doesn't exist, this is a no-op.
     *
     * @param node - The node to remove outgoing edges from.
     * @return This DAG.
     */
    public deleteOutgoingEdgesOf(node: T): this {
        return this.#deleteAllEdges('outgoing', node);
    }

    /**
     * Removes all incoming edges to a given node.
     * If such node doesn't exist, this is a no-op.
     *
     * @param node - The node to remove incoming edges to.
     * @return This DAG.
     */
    public deleteIncomingEdgesOf(node: T): this {
        return this.#deleteAllEdges('incoming', node);
    }

    /**
     * Returns the given nodes in a topological order.
     *
     * In a case that a node does not exist in the graph, it is pushed to the end of the array.
     *
     * @param nodes - The nodes to sort.
     * @return An array of the given nodes in a topological order.
     */
    public getNodeOrder(...nodes: T[]): T[] {
        return this.sortNodes(nodes);
    }

    /**
     * Sorts the given array of nodes, in place by their topological order.
     *
     * In a case that a node does not exist in the graph, it is pushed to the end of the array.
     *
     * @param nodes - The nodes to sort.
     * @return The input array of nodes, sorted in a topological order.
     */
    public sortNodes(nodes: T[]): T[] {
        return nodes.sort((lhsId, rhsId) => {
            const lhs = this.#nodes.get(lhsId);
            if (!lhs) {
                return +1;
            }

            const rhs = this.#nodes.get(rhsId);
            if (!rhs) {
                return -1;
            }

            return byValue(lhs.order, rhs.order);
        });
    }

    /**
     * Returns (an unordered) set of all immediate predecessors of the given nodes.
     *
     * @param nodes - The nodes to get immediate predecessors of.
     * @return An unordered set of all immediate predecessors of the given nodes.
     */
    public getImmediatePredecessorsOf(...nodes: T[]): Set<T> {
        return this.#getImmediate('incoming', ...nodes);
    }

    /**
     * Returns an iterable of all immediate predecessors of the given nodes which
     * iterates over them in a topological order.
     *
     * @param nodes - The nodes to get immediate predecessors of.
     * @return A topologically ordered iterable of all immediate predecessors of the given nodes.
     */
    public getOrderedImmediatePredecessorsOf(...nodes: T[]): Iterable<T> {
        return this.#toOrderedIterable(this.getImmediatePredecessorsOf(...nodes));
    }

    /**
     * Returns (an unordered) set of all predecessors of the given nodes.
     *
     * @param nodes - The nodes to get predecessors of.
     * @return An unordered set of all predecessors of the given nodes.
     */
    public getPredecessorsOf(...nodes: T[]): Set<T> {
        return this.#getReachable('incoming', ...nodes);
    }

    /**
     * Returns an iterable of all predecessors of the given nodes which
     * iterates over them in a topological order.
     *
     * @param nodes - The nodes to get predecessors of.
     * @return A topologically ordered iterable of all predecessors of the given nodes.
     */
    public getOrderedPredecessorsOf(...nodes: T[]): Iterable<T> {
        return this.#toOrderedIterable(this.getPredecessorsOf(...nodes));
    }

    /**
     * Returns (an unordered) set of all immediate successors of the given nodes.
     *
     * @param nodes - The nodes to get immediate successors of.
     * @return An unordered set of all immediate successors of the given nodes.
     */
    public getImmediateSuccessorsOf(...nodes: T[]): Set<T> {
        return this.#getImmediate('outgoing', ...nodes);
    }

    /**
     * Returns an iterable of all immediate successors of the given nodes which
     * iterates over them in a topological order.
     *
     * @param nodes - The nodes to get immediate successors of.
     * @return A topologically ordered iterable of all immediate successors of the given nodes.
     */
    public getOrderedImmediateSuccessorsOf(...nodes: T[]): Iterable<T> {
        return this.#toOrderedIterable(this.getImmediateSuccessorsOf(...nodes));
    }

    /**
     * Returns (an unordered) set of all successors of the given nodes.
     *
     * @param nodes - The nodes to get successors of.
     * @return An unordered set of all successors of the given nodes.
     */
    public getSuccessorsOf(...nodes: T[]): Set<T> {
        return this.#getReachable('outgoing', ...nodes);
    }

    /**
     * Returns an iterable of all successors of the given nodes which
     * iterates over them in a topological order.
     *
     * @param nodes - The nodes to get successors of.
     * @return A topologically ordered iterable of all successors of the given nodes.
     */
    public getOrderedSuccessorsOf(...nodes: T[]): Iterable<T> {
        return this.#toOrderedIterable(this.getSuccessorsOf(...nodes));
    }

    /**
     * Checks whether a directed path between two nodes exists in the graph.
     *
     * If A is directly connected to B, `hasPath(A, B)` is exactly the same as `hasEdge(A, B)`.
     * On the other hand, if only the edges `A -> B` and `A -> C` exists in the
     * graph, a `hasPath(A, C)` returns `true`, while `hasEdge(A, C)` returns `false`.
     *
     *
     * @param from - The "source" node.
     * @param to - The "target" node.
     * @return `true` if a directed path exists, `false` otherwise.
     */
    public hasPath(from: T, to: T): boolean {
        if (from == to) {
            return false;
        }

        const fromNode = this.#nodes.get(from);
        const toNode = this.#nodes.get(to);

        if (!fromNode || !toNode || fromNode.order > toNode.order) {
            return false;
        }

        if (fromNode.outgoing.has(to)) {
            return true;
        }

        const queue = [from];
        const visited = new Set(queue);

        while (queue.length > 0) {
            for (const successor of this.#nodes.get(queue.shift()!)!.outgoing) {
                if (successor == to) {
                    return true;
                }

                if (!visited.has(successor)) {
                    visited.add(successor);
                    queue.push(successor);
                }
            }
        }

        return false;
    }

    /**
     * Merges two nodes if such action would not introduce a cycle.
     *
     * "Merging" of A and B is performed by making:
     *   - all immediate predecessors of B be immediate predecessors of A, and
     *   - all immediate successors of B be immediate successors of A.
     *
     * After that remapping, node B gets removed from the graph.
     *
     * **Note:** This method is a no-op if either A or B is absent in the graph.
     *
     * If there is a path between A and B (in either direction), a CycleError
     * gets thrown, and the graph is not changed.
     *
     * @param a - The first node to merge.
     * @param b - The second node to merge.
     * @return This DAG.
     */
    public mergeNodes(a: T, b: T): this {
        if (a == b) {
            return this;
        }

        const nodeA = this.#nodes.get(a);
        const nodeB = this.#nodes.get(b);

        if (nodeA && nodeB) {
            if (this.hasPath(a, b) || this.hasPath(b, a)) {
                throw new CycleError();
            }

            for (const predecessor of nodeB.incoming) {
                this.addEdge(predecessor, a);
            }

            for (const successor of nodeB.outgoing) {
                this.addEdge(a, successor);
            }

            this.delete(b);
        }

        return this;
    }

    /**
     * Tries to merge two nodes if such action would not introduce a cycle.
     *
     * "Merging" of A and B is performed by making:
     *   - all immediate predecessors of B be immediate predecessors of A, and
     *   - all immediate successors of B be immediate successors of A.
     *
     * After that remapping, node B gets removed from the graph.
     *
     * **Note:** This method is a no-op if either A or B is absent in the graph.
     *
     * If there is a path between A and B (in either direction), the merging would
     * introduce a cycle so this function returns `false`, and the graph is not changed.
     *
     * @param a - The first node to merge.
     * @param b - The second node to merge.
     * @return True if the nodes were successfully merged, or if
     * at least one of the given nodes is not present in the graph.
     */
    tryMergeNodes(a: T, b: T): boolean {
        try {
            this.mergeNodes(a, b);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns an array of node arrays, where each inner array represents a subgraph.
     *
     * The nodes in each subgraph are topologically ordered.
     *
     * @return An array of independent subgraphs.
     */
    subGraphs(): T[][] {
        const result: T[][] = [];

        if (this.#order.length == 0) {
            return result;
        }

        const visited = new Set<T>();

        for (const id of this.#order) {
            if (visited.has(id)) {
                continue;
            }

            const subGraph = new PriorityQueue<T>();
            const stack = [id];

            while (stack.length > 0) {
                const id = stack.pop()!;

                if (visited.has(id)) {
                    continue;
                }

                const node = this.#nodes.get(id)!;

                visited.add(id);
                subGraph.enqueue(id, node.order);

                for (const successor of node.outgoing) {
                    if (!visited.has(successor)) {
                        stack.push(successor);
                    }
                }
            }

            result.push(subGraph.toArray());
        }

        return result;
    }

    /**
     * Adds a node to the graph and returns it.
     * If the node already exists, it is returned unchanged.
     *
     * @param id - The node to add.
     * @returns The Node state object.
     */
    #ensureNodeExists(id: T): Node<T> {
        let node = this.#nodes.get(id);
        if (node) {
            return node;
        }

        node = {
            id,
            order: this.#order.length,
            incoming: new Set(),
            outgoing: new Set(),
        };

        this.#nodes.set(id, node);
        this.#order.push(id);

        return node;
    }

    /**
     * Tries to add a directed edge to the graph.
     *
     * If any of the nodes doesn't already exist, it will be added.
     *
     * If inserting the given edge would introduce a cycle no changes
     * are made to the graph and CycleError is thrown.
     *
     * @param from - The "source" node.
     * @param to - The "target" node.
     */
    #addEdge(from: T, to: T): void {
        if (this.hasEdge(from, to)) {
            return;
        }

        //
        // This function implements the PK algorithm for incremental
        // topological ordering as presented in the paper:
        //
        //		PEARCE, David J.; KELLY, Paul HJ. A dynamic algorithm for
        //		topologically sorting directed acyclic graphs.
        //		Lecture notes in computer science, 2004, 3059: 383-398.
        //
        //		https://citeseerx.ist.psu.edu/document?doi=388da0bed2a1658a34de39b28921de48f353b2ed
        //

        // N.B. intentionally reversing direction
        const u = this.#ensureNodeExists(to);
        const v = this.#ensureNodeExists(from);

        if (u.order < v.order) {
            const successors = this.#findSuccessors(u, v.order);
            const predecessors = this.#findPredecessors(v, u.order);

            successors.sort(byOrder);
            predecessors.sort(byOrder);

            const totalPredecessors = predecessors.length;
            const totalAffected = totalPredecessors + successors.length;

            const topology = new Array<number>(totalAffected);

            let i = 0;
            for (const { order } of successors) {
                topology[i++] = order;
            }
            for (const { order } of predecessors) {
                topology[i++] = order;
            }

            topology.sort(byValue);

            for (i = 0; i < totalPredecessors; i++) {
                const index = topology[i]!;
                const predecessor = predecessors[i]!;
                this.#order[index] = predecessor.id;
                predecessor.order = index;
            }
            for (i = totalPredecessors; i < totalAffected; i++) {
                const index = topology[i]!;
                const successor = successors[i - totalPredecessors]!;
                this.#order[index] = successor.id;
                successor.order = index;
            }
        }

        u.incoming.add(from);
        v.outgoing.add(to);
    }

    /**
     * Removes all edges from a given node in the given direction (i.e. incoming or outgoing).
     * If such node doesn't exist, this is a no-op.
     *
     * @param direction - The direction of the edges to remove.
     * @param node - The node whose incoming edges to remove.
     * @return This DAG.
     */
    #deleteAllEdges(direction: 'incoming' | 'outgoing', node: T): this {
        const state = this.#nodes.get(node);

        if (state) {
            const reversed = direction == 'incoming' ? 'outgoing' : 'incoming';

            for (const from of state[direction]) {
                this.#nodes.get(from)![reversed].delete(node);
            }

            state[direction].clear();
        }

        return this;
    }

    /**
     * Returns all successors of the given node, such that their current topological
     * order is less than the given one. These nodes will need to be reordered.
     *
     * @param startNode - The node whose successors to return.
     * @param order - The order to constrain the successor set with.
     * @return The unordered list of successors nodes.
     */
    #findSuccessors(startNode: Node<T>, order: number): Node<T>[] {
        const result: Node<T>[] = [];
        const visited = new Set<T>();
        const stack = [startNode];

        while (stack.length > 0) {
            const node = stack.pop()!;

            if (visited.has(node.id)) {
                continue;
            }

            visited.add(node.id);
            result.push(node);

            for (const id of node.outgoing) {
                const successor = this.#nodes.get(id)!;

                if (successor.order == order) {
                    throw new CycleError();
                }
                if (!visited.has(id) && successor.order < order) {
                    stack.push(successor);
                }
            }
        }

        return result;
    }

    /**
     * Returns all predecessors of the given node, such that their current topological
     * order is greater than the given one. These nodes will need to be reordered.
     *
     * @param startNode - The node whose predecessors to return.
     * @param order - The order to constrain the predecessor set with.
     * @return The unordered list of predecessors nodes.
     */
    #findPredecessors(startNode: Node<T>, order: number): Node<T>[] {
        const result: Node<T>[] = [];
        const visited = new Set<T>();
        const stack = [startNode];

        while (stack.length > 0) {
            const node = stack.pop()!;

            if (visited.has(node.id)) {
                continue;
            }

            visited.add(node.id);
            result.push(node);

            for (const id of node.incoming) {
                const predecessor = this.#nodes.get(id)!;

                if (!visited.has(id) && predecessor.order >= order) {
                    stack.push(predecessor);
                }
            }
        }

        return result;
    }

    /**
     * Returns (an unordered) set of all immediate neighbors of the given nodes.
     *
     * @param direction - The direction of the edges to traverse.
     * @param nodes - Nodes whose immediate neighbors to return.
     * @return An unordered set of all immediate neighbors of the given nodes.
     */
    #getImmediate(direction: 'incoming' | 'outgoing', ...nodes: T[]): Set<T> {
        let results = new Set<T>();

        for (const id of nodes) {
            const node = this.#nodes.get(id);
            if (node) {
                results = union(results, node[direction]);
            }
        }

        for (const id of nodes) {
            results.delete(id);
        }

        return results;
    }

    /**
     * Returns (an unordered) set of all nodes reachable from the given nodes.
     *
     * @param direction - The direction of the edges to traverse.
     * @param nodes - Nodes whose reachable nodes to return.
     * @return An unordered set of all reachable nodes of the given nodes..
     */
    #getReachable(direction: 'incoming' | 'outgoing', ...nodes: T[]): Set<T> {
        const results = new Set(nodes);
        const queue = nodes.slice(0);

        while (queue.length > 0) {
            const node = this.#nodes.get(queue.shift()!);
            if (!node) {
                continue;
            }

            for (const id of node[direction]) {
                if (!results.has(id)) {
                    results.add(id);
                    queue.push(id);
                }
            }
        }

        for (const id of nodes) {
            results.delete(id);
        }

        return results;
    }

    /**
     * Returns a new iterable which iterates over the nodes
     * in the given iterable in topological order.
     *
     * **Note:** This function assumes that all nodes
     * in the given iterable are present in the graph.
     *
     * @param ids - An iterable of node ids.
     * @returns Iterable over the given nodes in topological order.
     */
    #toOrderedIterable(ids: Iterable<T>): Iterable<T> {
        const queue = new PriorityQueue<T>();

        for (const id of ids) {
            queue.enqueue(id, this.#nodes.get(id)!.order);
        }

        return queue;
    }
}
