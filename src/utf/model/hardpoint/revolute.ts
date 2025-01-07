import { type ReadableDirectory, type WritableDirectory } from '../../types.js'
import Fixed from './fixed.js'
import Axis from './axis.js'
import { Matrix, Quaternion, Vector } from '../../../math/index.js'

export default class Revolute extends Fixed {
    get [Symbol.toStringTag]() {
        return 'RevoluteHardpoint'
    }

    readonly filename: string = 'Revolute'

    /** Spin axis direction relative to hardpoint orientation. */
    #axis = new Axis()

    constructor(
        position?: Vector.VectorLike,
        orientation?: Quaternion.QuaternionLike | Matrix.MatrixLike,
        axis = Vector.axisY(),
        public minimum = 0,
        public maximum = 0
    ) {
        super(position, orientation)

        this.#axis.x = axis.x
        this.#axis.y = axis.y
        this.#axis.z = axis.z
    }

    get byteLength() {
        return super.byteLength + this.#axis.byteLength + 2 * Float32Array.BYTES_PER_ELEMENT
    }

    get axis(): Vector.VectorLike {
        return Vector.copy(this.axis)
    }

    set axis(value) {
        const { x, y, z } = Vector.normalize(value)

        this.#axis.x = x
        this.#axis.y = y
        this.#axis.z = z
    }

    read(parent: ReadableDirectory): void {
        super.read(parent)

        parent.read(this.#axis)
        ;[this.minimum = this.minimum] = parent.getFile('Min')?.readFloats() ?? []
        ;[this.maximum = this.maximum] = parent.getFile('Max')?.readFloats() ?? []
    }

    write(parent: WritableDirectory): void {
        super.write(parent)

        parent.write(this.#axis)
        parent.setFile('Min').writeFloats(this.minimum)
        parent.setFile('Max').writeFloats(this.maximum)
    }
}
