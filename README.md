# @haragei/dag

A TypeScript library implementing Directed Acyclic Graph (DAG) data structure with online cycle detection and topological ordering.

A DAG is a finite graph that consists of nodes (a.k.a. vertices) and edges, with the edges directed from one node to another, ensuring that there are no cycles. This means you cannot start at any node and follow a consistently directed sequence of edges that eventually loops back to that node.

## Features

- **Online Cycle Detection**: The library dynamically checks for cycles as edges are added, ensuring the graph remains acyclic.

- **Topological Ordering**: It provides O(1) getter to order the nodes of the graph linearly such that for every directed edge from node `u` to node `v`, `u` comes before `v` in the ordering. This is particularly useful in scenarios like task scheduling, where certain tasks must precede others.

## Installation

```bash
npm install @haragei/dag
```
<details>
<summary>pnpm</summary>

```bash 
pnpm add @haragei/dag
```
</details>

<details>
<summary>yarn</summary>

```bash 
yarn add @haragei/dag
```
</details>

## Usage

Creating a Graph:
```ts
import { DAG } from '@haragei/dag';

// Populate the graph with initial nodes
const graph = new DAG(['A', 'B', 'C']);
```

Adding nodes:
```ts
// Add few more nodes
graph
    .add('D')
    .add('E')
    .add('F');
```

Adding edges and detecting cycles:
```ts
// Add edge from 'A' to 'B'
graph.addEdge('A', 'B'); // No cycle

// Add edge from 'B' to 'C'
graph.addEdge('B', 'C'); // No cycle

// Attempt to add edge from 'C' to 'A'
try {
    graph.addEdge('C', 'A'); // Cycle detected
} catch (error) {
    console.error(error.message); // "Cycle detected"
}

// Verify no edge with cycle was added:
console.log(graph.hasEdge('C', 'A')); // false

// Add few more valid edges
graph.addEdge('B', 'D');
graph.addEdge('D', 'E');
graph.addEdge('E', 'C');
graph.addEdge('C', 'F');
```

Topological order:
```ts
console.log(graph.order); // ['A', 'B', 'D', 'E', 'C', 'F']
```

## API Reference


### `DAG`

A Directed Acyclic Graph structure with online cycle detection and topological ordering.

Create / Copy:
- [`new DAG()`](#constructorinitialnodes-iterablet)
- [`.copy()`](#copy-dagt)

Properties:
- [`.order`](#order-t)
- [`.size`](#size-number)

Iteration:
- [`[Symbol.iterator]()`](#symboliterator-iterableiteratort)
- [`.keys()`](#keys-iterableiteratort)

Nodes:
- [`.clear()`](#clear-this)
- [`.add()`](#addnode-t-this)
- [`.has()`](#hasnode-t-boolean)
- [`.delete()`](#deletenode-t-this)

Edges:
- [`.addEdge()`](#addedgefrom-t-to-t-this)
- [`.tryAddEdge()`](#tryaddedgefrom-t-to-t-boolean)
- [`.hasEdge()`](#hasedgefrom-t-to-t-boolean)
- [`.hasPath()`](#haspathfrom-t-to-t-boolean)
- [`.deleteEdge()`](#deleteedgefrom-t-to-t-this)
- [`.deleteOutgoingEdgesOf()`](#deleteoutgoingedgesofnode-t-this)
- [`.deleteIncomingEdgesOf()`](#deleteincomingedgesofnode-t-this)

Sorting / Ordering:
- [`.getNodeOrder()`](#getnodeordernodes-t-t)
- [`.sortNodes()`](#sortnodesnodes-t-t)

Subgraphs:
- [`.subGraphs()`](#subgraphs-t)
- [`.parallelize()`](#parallelize-parallelcollectiont)

Predecessors / Successors:
- [`.getImmediatePredecessorsOf()`](#getimmediatepredecessorsofnodes-t-sett)
- [`.getOrderedImmediatePredecessorsOf()`](#getorderedimmediatepredecessorsofnodes-t-iterablet)
- [`.getPredecessorsOf()`](#getpredecessorsofnodes-t-sett)
- [`.getOrderedPredecessorsOf()`](#getorderedpredecessorsofnodes-t-iterablet)
- [`.getImmediateSuccessorsOf()`](#getimmediatesuccessorsofnodes-t-sett)
- [`.getOrderedImmediateSuccessorsOf()`](#getorderedimmediatesuccessorsofnodes-t-iterablet)
- [`.getSuccessorsOf()`](#getsuccessorsofnodes-t-sett)
- [`.getOrderedSuccessorsOf()`](#getorderedsuccessorsofnodes-t-iterablet)

Merging:
- [`.mergeNodes()`](#mergenodesa-t-b-t-this)
- [`.tryMergeNodes()`](#trymergenodesa-t-b-t-boolean)


#### `constructor(initialNodes?: Iterable<T>)`

Creates a new DAG with optional initial nodes.

**Parameters:**
- `initialNodes`: An optional iterable of nodes to populate the graph with.

**Returns:** a new instance of `DAG`.


#### `copy(): DAG<T>`

Creates a new, independent copy of this DAG.

**Returns:** Clone of this `DAG`.


#### `order: T[]`

Returns a list of all nodes in the graph in a topological order.

**Note:** for every `U -> V` directed edge, `U` will appear before `V` in a topological order.

**Returns:** An array of all graph nodes in a topological order.


#### `size: number`

Returns the number of nodes in the graph.

**Returns:** Number of nodes in the graph.


#### `[Symbol.iterator](): IterableIterator<T>`

Returns an iterator that yields all nodes in the graph in a topological order.

**Alias:** `keys()`
**Returns:** An iterator over all graph nodes in the graph.


#### `keys(): IterableIterator<T>`

Returns an iterator that yields all nodes in the graph in a topological order.

**Returns:** An iterator over all graph nodes in the graph.


#### `clear(): this`

Removes all nodes (and their edges) from the graph.

**Returns:** This `DAG`.


#### `add(node: T): this`

Adds a new node to the graph.  
If the node already exists, this is a no-op.

**Parameters:**
- `node`: The node to add.

**Returns:** This `DAG`.


#### `has(node: T): boolean`

Checks if a specific node exists in the graph.

**Parameters:**
- `node`: The node to check.

**Returns:** `true` if the node exists, `false` otherwise.


#### `delete(node: T): this`

Removes a specified node from the graph.  
If such node doesn't exist, this is a no-op.

**Note:** This also removes all edges from or to the specified node.

**Parameters:**
- `node`: The node to remove.

**Returns:** This `DAG`.


#### `addEdge(from: T, to: T): this`

Tries to add a directed edge to the graph.

If any of the nodes doesn't already exist, it will be added.

If inserting the given edge would introduce a cycle no changes are made to the graph and `CycleError` is thrown.

Adding an edge from a node to that same node (i.e. `from` and `to` are the same) is considered a cycle and such edge cannot be added.

**Parameters:**
- `from`: The "source" node.
- `to`: The "target" node.

**Returns:** This `DAG`.


#### `tryAddEdge(from: T, to: T): boolean`

Tries to add a directed edge to the graph.

If any of the nodes doesn't already exist, it will be added.

If inserting the given edge would introduce a cycle no changes are made to the graph and `false` is returned.

Adding an edge from a node to that same node (i.e. `from` and `to` are the same) is considered a cycle and such edge cannot be added.

**Parameters:**
- `from`: The "source" node.
- `to`: The "target" node.

**Returns:** `true` if the edge was added, `false` otherwise.


#### `hasEdge(from: T, to: T): boolean`

Checks if a specific (directed) edge exists in the graph.

**Parameters:**
- `from`: The "source" node.
- `to`: The "target" node.

**Returns:** `true` if the edge exists, `false` otherwise.


#### `hasPath(from: T, to: T): boolean`

Checks whether a directed path between two nodes exists in the graph.

If A is directly connected to B, `hasPath(A, B)` is exactly the same as `hasEdge(A, B)`.  
On the other hand, if only the edges `A -> B` and `A -> C` exists in the graph, a `hasPath(A, C)` returns `true`, while `hasEdge(A, C)` returns `false`.

**Parameters:**
- `from`: The "source" node.
- `to`: The "target" node.

**Returns:** `true` if a directed path exists, `false` otherwise.


#### `deleteEdge(from: T, to: T): this`

Removes a specified edge from the graph.  
If such edge doesn't exist, this is a no-op.

**Note:** this removes a directed edge. If an edge `A -> B` exists, it will not be removed with a `removeEdge(B, A)` call.

**Parameters:**
- `from`: The "source" node.
- `to`: The "target" node.

**Returns:** This `DAG`.


#### `deleteOutgoingEdgesOf(node: T): this`

Removes all outgoing edges from a given node.  
If such node doesn't exist, this is a no-op.

**Parameters:**
- `node`: The node to remove outgoing edges from.

**Returns:** This `DAG`.


#### `deleteIncomingEdgesOf(node: T): this`

Removes all incoming edges to a given node.  
If such node doesn't exist, this is a no-op.

**Parameters:**
- `node`: The node to remove incoming edges to.

**Returns:** This `DAG`.


#### `getNodeOrder(...nodes: T[]): T[]`

Returns the given nodes in a topological order.

In a case that a node does not exist in the graph, it is pushed to the end of the array.

**Parameters:**
- `nodes`: The nodes to sort.

**Returns:** An array of the given nodes in a topological order.


#### `sortNodes(nodes: T[]): T[]`

Sorts the given array of nodes, in place by their topological order.

In a case that a node does not exist in the graph, it is pushed to the end of the array.

**Parameters:**
- `nodes`: The nodes to sort.

**Returns:** The input array of nodes, sorted in a topological order.


#### `subGraphs(): T[][]`

Returns an array of node arrays, where each inner array represents a subgraph.

The nodes in each subgraph are topologically ordered.

**Returns:** An array of independent subgraphs.


#### `parallelize(): ParallelCollection<T>`

Returns a set of all subgraphs in the graph.

Each subgraph is represented either as a single node, or as an array which
is meant to be processed sequentially and its items are either a single node
or a Set of nodes that can be processed in parallel.

**Example:**
```typescript
const dag = new DAG<string>(['Z']);
dag.addEdge('A', 'B');
dag.addEdge('A', 'C');
dag.addEdge('B', 'D');
dag.addEdge('C', 'D');
dag.addEdge('X', 'Y');

console.log(dag.parallelize());
// Set(3) { [ 'A', Set(2) { 'B', 'C' }, 'D' ], [ 'X', 'Y' ], 'Z' }
```

**Returns:** A set of all subgraphs in the graph, parallelized.


#### `getImmediatePredecessorsOf(...nodes: T[]): Set<T>`

Returns (an unordered) set of all immediate predecessors of the given nodes.

**Parameters:**
- `nodes`: The nodes to get immediate predecessors of.

**Returns:** An unordered set of all immediate predecessors of the given nodes.


#### `getOrderedImmediatePredecessorsOf(...nodes: T[]): Iterable<T>`

Returns an iterable of all immediate predecessors of the given nodes which iterates over them in a topological order.

**Parameters:**
- `nodes`: The nodes to get immediate predecessors of.

**Returns:** A topologically ordered iterable of all immediate predecessors of the given nodes.


#### `getPredecessorsOf(...nodes: T[]): Set<T>`

Returns (an unordered) set of all predecessors of the given nodes.

**Parameters:**
- `nodes`: The nodes to get predecessors of.

**Returns:** An unordered set of all predecessors of the given nodes.


#### `getOrderedPredecessorsOf(...nodes: T[]): Iterable<T>`

Returns an iterable of all predecessors of the given nodes which iterates over them in a topological order.

**Parameters:**
- `nodes`: The nodes to get predecessors of.

**Returns:** A topologically ordered iterable of all predecessors of the given nodes.


#### `getImmediateSuccessorsOf(...nodes: T[]): Set<T>`

Returns (an unordered) set of all immediate successors of the given nodes.

**Parameters:**
- `nodes`: The nodes to get immediate successors of.

**Returns:** An unordered set of all immediate successors of the given nodes.


#### `getOrderedImmediateSuccessorsOf(...nodes: T[]): Iterable<T>`

Returns an iterable of all immediate successors of the given nodes which iterates over them in a topological order.

**Parameters:**
- `nodes`: The nodes to get immediate successors of.

**Returns:** A topologically ordered iterable of all immediate successors of the given nodes.


#### `getSuccessorsOf(...nodes: T[]): Set<T>`

Returns (an unordered) set of all successors of the given nodes.

**Parameters:**
- `nodes`: The nodes to get successors of.

**Returns:** An unordered set of all successors of the given nodes.


#### `getOrderedSuccessorsOf(...nodes: T[]): Iterable<T>`

Returns an iterable of all successors of the given nodes which iterates over them in a topological order.

**Parameters:**
- `nodes`: The nodes to get successors of.

**Returns:** A topologically ordered iterable of all successors of the given nodes.


#### `mergeNodes(a: T, b: T): this`

Merges two nodes if such action would not introduce a cycle.

"Merging" of `A` and `B` is performed by making: 
  - all immediate predecessors of `B` be immediate predecessors of `A`, and 
  - all immediate successors of `B` be immediate successors of `A`.

 After that remapping, node `B` gets removed from the graph.

 **Note:** This method is a no-op if either `A` or `B` is absent in the graph.

 If there is a path between `A` and `B` (in either direction), a `CycleError` gets thrown, and the graph is not changed.

**Parameters:**
- `a`: The first node to merge.
- `b`: The second node to merge.

**Returns:** This `DAG`.


#### `tryMergeNodes(a: T, b: T): boolean`

Merges two nodes if such action would not introduce a cycle.

"Merging" of `A` and `B` is performed by making: 
  - all immediate predecessors of `B` be immediate predecessors of `A`, and 
  - all immediate successors of `B` be immediate successors of `A`.

 After that remapping, node `B` gets removed from the graph.

 **Note:** This method is a no-op if either `A` or `B` is absent in the graph.

 If there is a path between `A` and `B` (in either direction), the merging would introduce a cycle so this function returns `false`, and the graph is not changed.

**Parameters:**
- `a`: The first node to merge.
- `b`: The second node to merge.

**Returns:** This `DAG`.

## References

The core algorithm for cycle detection & dynamic topological ordering is an implementation of the following paper:

> _PEARCE_, David J.; _KELLY_, Paul HJ.  
> A dynamic algorithm for topologically sorting directed acyclic graphs.
>
> <cite>-- Lecture notes in computer science, 2004, 3059: 383-398. [[PDF]](https://citeseerx.ist.psu.edu/document?doi=388da0bed2a1658a34de39b28921de48f353b2ed)</cite>


## Contributing

Contributions are welcome! For feature requests and bug reports, please [submit an issue](