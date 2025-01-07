import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { type ReadsFile, type WritesFile } from '../../types.js'
import { Vector } from '../../../math/index.js'
import { readVector, writeVector } from '../../utility.js'

export default class Position implements ReadsFile, WritesFile, Vector.VectorLike {
    readonly kind = 'file'

    constructor(
        public x = 0,
        public y = 0,
        public z = 0
    ) {}

    get byteLength(): number {
        return Vector.BYTES_PER_ELEMENT
    }

    read(view: BufferReader): void {
        ;({ x: this.x, y: this.y, z: this.z } = readVector(view))
    }

    write(view: BufferWriter): void {
        writeVector(view, this)
    }
}
