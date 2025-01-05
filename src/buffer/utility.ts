import { Readable, Writable } from './types.js'
import BufferView, { isWritable } from './view.js'

interface HasByteLength {
    byteLength?: number
}

/**
 * Total byte length of objects.
 * @param values 
 * @returns 
 */
export const getByteLength = (...values: HasByteLength[]): number => values.reduce((total, { byteLength = 0 }) => total + byteLength, 0)

/**
 * Writes into buffer chunks.
 * @param values 
 */
export function* writeBuffers(values: Iterable<Writable>): Generator<ArrayBuffer> {
    for (const value of values) {
        const view = BufferView.from(value.byteLength)
        value.write(view)
        yield view.buffer
    }
}

export type NextReadable<T extends Readable> = (index: number, byteOffset: number, byteRemain: number) => T | null

/**
 * Reads view into readable objects.
 * @param array 
 * @param next 
 */
export function* readBuffers<T extends Readable>(array: ArrayBufferView, next: NextReadable<T>): Generator<T> {
    let index = 0

    const view = new BufferView(array.buffer, array.byteOffset, array.byteLength)

    do {
        const readable = next(index, view.byteOffset, view.byteRemain)
        if (!readable) break

        readable.read(view)
        yield readable
        index++
    } while (view.byteRemain)
}

/**
 * Concatenate array buffer chunks into single buffer.
 * @param chunks ArrayBuffer or a view of.
 * @returns
 */
export const concat = (...chunks: (ArrayBufferLike | ArrayBufferView | Writable)[]): Uint8Array<ArrayBuffer> => {
    let offset = 0

    const length = chunks.reduce((total, { byteLength }) => total + byteLength, 0)

    /** Combined resulting array. */
    const array = new Uint8Array(length)

    for (const chunk of chunks) {
        const buffer = ArrayBuffer.isView(chunk)
            ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
            : isWritable(chunk)
              ? new Uint8Array(BufferView.from(chunk).buffer)
              : new Uint8Array(chunk)

        array.set(buffer, offset)
        offset += chunk.byteLength
    }

    return array
}

/**
 * Split buffer by separator byte.
 * @param input Input buffer.
 * @param separator Separator code.
 * @param limit Split count.
 * @param offset Starting offset.
 * @returns
 */
export function* split(input: Uint8Array, separator: number, limit = Infinity, offset = 0) {
    while (limit > 0) {
        const index = input.indexOf(separator, offset)
        if (index < 0) return // Nothing more can be found.

        yield input.subarray(offset, index)
        offset = index + 1
        limit--
    }
}