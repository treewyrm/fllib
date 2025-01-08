import { BufferReader, BufferWriter } from '../../../buffer/types.js'
import { at, type Keyframe } from '../../../math/animation.js'
import { Matrix, Quaternion, Vector } from '../../../math/index.js'
import { QuaternionLike } from '../../../math/quaternion.js'
import { readVector, readMatrix, writeVector, writeMatrix } from '../../utility.js'
import Fixed from './fixed.js'

export default class Sphere extends Fixed {
    static readonly filename: string = 'Sphere'

    static get byteLength() {
        return super.byteLength + 9 * Float32Array.BYTES_PER_ELEMENT
    }

    get byteLength() {
        return Sphere.byteLength
    }

    offset = Vector.origin()
    minimum = Vector.origin()
    maximum = Vector.origin()

    rotationAt(time: number, keyframes: Keyframe<QuaternionLike>[]) {
        if (!keyframes.length) return this.rotation
        return Quaternion.slerp(...at(keyframes, time))
    }

    read(view: BufferReader): void {
        this.position = readVector(view)
        this.offset = readVector(view)
        this.rotation = Quaternion.fromMatrix(readMatrix(view))

        this.minimum.x = view.readFloat32()
        this.maximum.x = view.readFloat32()

        this.minimum.y = view.readFloat32()
        this.maximum.y = view.readFloat32()

        this.minimum.z = view.readFloat32()
        this.maximum.z = view.readFloat32()
    }

    write(view: BufferWriter): void {
        writeVector(view, this.position)
        writeVector(view, this.offset)
        writeMatrix(view, Matrix.fromQuaternion(this.rotation))

        view.writeFloat32(this.minimum.x)
        view.writeFloat32(this.maximum.x)

        view.writeFloat32(this.minimum.y)
        view.writeFloat32(this.maximum.y)

        view.writeFloat32(this.minimum.z)
        view.writeFloat32(this.maximum.z)
    }
}
