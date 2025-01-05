import { type ReadableDirectory, type WritableDirectory } from '../../types.js'
import { Vector } from '../../../math/index.js'
import { readVector, writeVector } from '../../utility.js'
import Fixed from './fixed.js'
import File from '../../file.js'

export default class Revolute extends Fixed {
    get [Symbol.toStringTag]() {
        return 'RevoluteHardpoint'
    }

    readonly filename = 'Revolute'

    /** Spin axis direction relative to hardpoint orientation. */
    axis = Vector.axisZ()

    /** Minimum rotation angle. */
    minimum = 0

    /** Maximum rotation angle. */
    maximum = 0

    get byteLength() {
        return super.byteLength + Vector.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT
    }

    clone(): Revolute {
        const hardpoint = new Revolute()
        hardpoint.copy(this)
        return hardpoint
    }

    copy(value: Revolute): void {
        super.copy(value)

        this.axis = Vector.copy(value.axis)
        this.minimum = value.minimum
        this.maximum = value.maximum
    }

    read(parent: ReadableDirectory): void {
        super.read(parent)

        const axis = parent.getFile('Axis')
        if (axis) this.axis = readVector(axis.view)

        ;[this.minimum = this.minimum] = parent.getFile('Min')?.readFloats() ?? []
        ;[this.maximum = this.maximum] = parent.getFile('Max')?.readFloats() ?? []
    }

    write(parent: WritableDirectory): void {
        super.write(parent)

        const axis = new File(Vector.BYTES_PER_ELEMENT)
        parent.set('Axis', axis)
        writeVector(axis.view, this.axis)

        parent.setFile('Min').writeFloats(this.minimum)
        parent.setFile('Max').writeFloats(this.maximum)
    }
}
