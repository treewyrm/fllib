import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Vector } from '../../../math/index.js'
import { readVector, writeVector } from '../../utility.js'
import Fixed from './fixed.js'

export default class Cylinder extends Fixed {
    static readonly filename: string = 'Cyl'

    static get byteLength() {
        return super.byteLength + 7 * Float32Array.BYTES_PER_ELEMENT
    }

    get byteLength() {
        return Cylinder.byteLength
    }

    axis = Vector.axisZ()

    translateMinimum = 0
    translateMaximum = 0
    rotateMinimum = 0
    rotateMaximum = 0

    read(view: BufferReader): void {
        super.read(view)
        this.axis = readVector(view)

        this.translateMinimum = view.readFloat32()
        this.translateMaximum = view.readFloat32()
        this.rotateMinimum = view.readFloat32()
        this.rotateMaximum = view.readFloat32()
    }

    write(view: BufferWriter): void {
        super.write(view)
        writeVector(view, this.axis)

        view.writeFloat32(this.translateMinimum)
        view.writeFloat32(this.translateMaximum)
        view.writeFloat32(this.rotateMinimum)
        view.writeFloat32(this.rotateMaximum)
    }
}
