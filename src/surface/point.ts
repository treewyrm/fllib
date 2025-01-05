import { type BufferReader, type BufferWriter } from '../buffer/types.js'
import { type VectorLike, BYTES_PER_ELEMENT } from '../math/vector.js'
import { readVector, writeVector } from './utility.js'

export default class Point implements VectorLike {
    constructor(
        public x = 0,
        public y = 0,
        public z = 0,

        /** Hull id. */
        public id = 0
    ) {}

    get byteLength(): number {
        return BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT
    }

    read(view: BufferReader): this {
        this.id = view.readInt32()
        ;({ x: this.x, y: this.y, z: this.z } = readVector(view))

        return this
    }

    write(view: BufferWriter): this {
        view.writeInt32(this.id)
        writeVector(view, this)

        return this
    }
}
