import crc32 from '../hash/crc32.js'
import ChunkedBuffer from './chunked.js'

type ByteRange = [begin: number, end: number]

const encoder = new TextEncoder()

export default class Dictionary extends ChunkedBuffer {
    readonly ranges = new Map<number, ByteRange>()

    /** Dictionary encoding buffer. */
    protected word: Uint8Array

    constructor(
        /** Dictionary word byte length. */
        byteLength = 0xff
    ) {
        super()
        this.word = new Uint8Array(byteLength)
    }

    /**
     * Pushes value into buffer stack and returns starting offset
     * @param value
     * @returns
     */
    push(value: string): ByteRange {
        const { word, ranges, byteLength, chunks } = this
        const { written } = encoder.encodeInto(value, word)
        
        if (written >= word.byteLength) throw new RangeError(`Word is too long for buffer of ${word.byteLength}`)

        // C-style NUL line termination.
        word[written] = 0

        const hash = crc32(word.subarray(0, written))

        let range = ranges.get(hash)
        if (range) return range

        range = [byteLength, byteLength + written]

        ranges.set(hash, range)
        chunks.push(word.slice(0, written + 1).buffer) // Copy 

        return range
    }
}
