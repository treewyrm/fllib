import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Matrix, Quaternion, Vector } from '../../../math/index.js'
import { readMatrix, readVector, writeMatrix, writeVector } from '../../utility.js'

export default class Fixed {
    static readonly filename: string = 'Fix'

    static get byteLength() {
        return 12 * Float32Array.BYTES_PER_ELEMENT
    }

    position = Vector.origin()
    rotation = Quaternion.identity()

    get byteLength() {
        return Fixed.byteLength
    }

    read(view: BufferReader) {
        this.position = readVector(view)
        this.rotation = Quaternion.fromMatrix(readMatrix(view))
    }

    write(view: BufferWriter) {
        writeVector(view, this.position)
        writeMatrix(view, Matrix.fromQuaternion(this.rotation))
    }
}
