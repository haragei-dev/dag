/**
 * Represents the state of a node added to the graph.
 */
export interface Node<T> {
    /**
     * The "id" of this node (i.e., this is a node, as far as public API is concerned).
     */
    readonly id: T;
    /**
     * The current index of this node in the topological order of the graph.
     */
    order: number;
    /**
     * The set of immediate predecessors of this node (i.e., all nodes that point to this node).
     */
    incoming: Set<T>;
    /**
     * The set of immediate successors od this node (i.e., all nodes that this node points to).
     */
    outgoing: Set<T>;
}
