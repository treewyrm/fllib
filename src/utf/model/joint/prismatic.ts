import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { type Keyframe, at } from '../../../math/animation.js'
import { Matrix, Quaternion, Scalar, Vector } from '../../../math/index.js'
import { readVector, readMatrix, writeVector, writeMatrix } from '../../utility.js'
import Fixed from './fixed.js'

export default class Prismatic extends Fixed {
    static readonly filename: string = 'Pris'

    static get byteLength() {
        return super.byteLength + 8 * Float32Array.BYTES_PER_ELEMENT
    }

    get byteLength() {
        return Prismatic.byteLength
    }

    offset = Vector.origin()
    axis = Vector.axisZ()

    minimum = 0
    maximum = 0

    positionAt(time: number, keyframes: Keyframe<number>[]) {
        const [weight, start, end] = at(keyframes, time)
        if (!start || !end) return this.position

        return Vector.add(Vector.multiplyScalar(this.axis, Scalar.linear(weight, start, end)), this.position)
    }

    read(view: BufferReader) {
        this.position = readVector(view)
        this.offset = readVector(view)
        this.rotation = Quaternion.fromMatrix(readMatrix(view))
        this.axis = readVector(view)

        this.minimum = view.readFloat32()
        this.maximum = view.readFloat32()
    }

    write(view: BufferWriter) {
        writeVector(view, this.position)
        writeVector(view, this.offset)
        writeMatrix(view, Matrix.fromQuaternion(this.rotation))
        writeVector(view, this.axis)

        view.writeFloat32(this.minimum)
        view.writeFloat32(this.maximum)
    }
}
