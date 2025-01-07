import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { type ReadsFile, type WritesFile } from '../../types.js'
import { Matrix, Quaternion } from '../../../math/index.js'
import { readMatrix, writeMatrix } from '../../utility.js'

export default class Orientation implements ReadsFile, WritesFile, Quaternion.QuaternionLike {
    readonly kind = 'file'

    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
        public w = 0
    ) {}

    get byteLength() {
        return Matrix.BYTES_PER_ELEMENT
    }

    read(view: BufferReader): void {
        ;({ x: this.x, y: this.y, z: this.z, w: this.w } = Quaternion.fromMatrix(readMatrix(view)))
    }

    write(view: BufferWriter): void {
        writeMatrix(view, Matrix.fromQuaternion(this))
    }
}
