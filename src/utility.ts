/**
 * Converts number into hex string.
 * @param value
 * @param byteLength
 * @param prefix
 * @returns
 */
export const toHex = (value: number, byteLength = 4, prefix = '0x') =>
    prefix +
    (value >>> 0)
        .toString(16)
        .toUpperCase()
        .padStart(byteLength * 2, '0')

/**
 * Recursively walks over object.
 * @param input Initial set of items.
 * @param recurse Called upon every item to get deeper objects.
 */
export function* recurse<T>(input: Iterable<T>, recurse: (parent: T) => Iterable<T>): Generator<T> {
    const queue = [...input]
    let item: T | undefined

    while ((item = queue.shift())) {
        yield item

        queue.push(...recurse(item))
    }
}

interface FlattenResult<T> {
    /** Depth level. */
    depth: number

    /** Entry index. */
    childId: number

    /** Entry value. */
    child: T

    /** Parent entry index. */
    parentId?: number

    /** Parent value. */
    parent?: T
}

/**
 * Flatten hierarchy of objects where each may return iterator for children.
 * @param input Initial value
 * @param iterate Callback upon current iteration to feed the queue
 * @param count Start index
 */
export function* flatten<T>(input: Iterable<T>, iterate: (parent: T) => Iterable<T>, count = 0): Generator<FlattenResult<T>> {
    const queue: FlattenResult<T>[] = [...input].map((value) => ({
        childId: count++,
        child: value,
        depth: 0,
    }))

    let item: FlattenResult<T> | undefined

    while ((item = queue.shift())) {
        const { childId: parentId, child: parent, depth } = item

        for (const child of iterate(parent))
            queue.push({
                childId: count++,
                child,
                parentId,
                parent,
                depth: depth + 1,
            })

        yield item
    }
}

type TransformCallback<T, V> = (value: T, index: number, array: T[]) => { childId: number; parentId?: number; child: V }

interface PairValue<V> {
    childId: number
    child: V
    parentId?: number
    parent?: V
    array: ReturnType<TransformCallback<unknown, V>>[]
}

type PairCallback<V> = (value: PairValue<V>) => void

/**
 * Assemble hierarchy of objects from flat array.
 * @param input
 * @param transform Transform flat structure into
 * @param pair Pair child -> parent objects callback
 * @returns
 */
export function assemble<T, V>(input: Iterable<T>, transform: TransformCallback<T, V>, pair: PairCallback<V>): V[] {
    const items = [...input].map(transform)
    const roots: V[] = []

    for (const { child, childId, parentId } of items) {
        if (!parentId) roots.push(child)

        const parent = items.find(({ childId }) => childId === parentId)?.child

        pair({
            childId,
            child,
            parentId,
            parent,
            array: items,
        })
    }

    return roots
}
