import { getByteLength } from './utility.js'
import { concat } from './utility.js'

/**
 * Chunked buffer can contain multiple buffers or views and will concatenate them whenever buffer is retrieved.
 */
export default class ChunkedBuffer {
    chunks: (ArrayBufferLike | ArrayBufferView)[] = []

    readonly byteOffset = 0

    /** How many chunks are there. */
    get length() {
        return this.chunks.length
    }

    get buffer(): ArrayBuffer {
        let buffer = this.chunks.at(0)

        // When more than one chunks are stored and/or chunk isn't ArrayBuffer then combine everything into single ArrayBuffer.
        if (!(buffer instanceof ArrayBuffer && this.length === 1)) this.buffer = buffer = concat(...this.chunks).buffer

        return buffer
    }

    set buffer(value: ArrayBuffer) {
        this.chunks = [value]
    }

    /** Sum of all chunks byte lengths. */
    get byteLength(): number {
        return getByteLength(...this.chunks)
    }

    /** Chunked buffer is growable but not shrinkable. */
    set byteLength(value: number) {
        if ((value -= this.byteLength) > 0) this.chunks.push(new ArrayBuffer(value))
    }
}
