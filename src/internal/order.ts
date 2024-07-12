import type { Node } from './node';

/**
 * Compares two Node<T> objects by order.
 *
 * @param lhs - The left hand-side operand.
 * @param rhs - The right hand-side operand.
 * @return Negative number if 'lhs' is less than 'rhs', positive number if
 * `lhs` is greater than `rhs`, or 0 if they have equal order.
 */
export function byOrder<T>(lhs: Node<T>, rhs: Node<T>): -1 | 0 | 1 {
    return byValue(lhs.order, rhs.order);
}

/**
 * Compares two numbers by value.
 *
 * @param lhs - The left hand-side operand.
 * @param rhs - The right hand-side operand.
 * @return Negative number if 'lhs' is less than 'rhs', positive number if
 * `lhs` is greater than `rhs`, or 0 if they are equal.
 */
export function byValue(lhs: number, rhs: number): -1 | 0 | 1 {
    return lhs < rhs ? -1 : lhs == rhs ? 0 : +1;
}
