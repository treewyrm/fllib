import {
    type ReadsDirectory,
    type WritesDirectory,
    type ReadableDirectory,
    type WritableDirectory,
} from '../../types.js'
import Position from './position.js'
import Orientation from './orientation.js'
import { Matrix, Quaternion, Vector } from '../../../math/index.js'

export default class Fixed implements ReadsDirectory, WritesDirectory {
    get [Symbol.toStringTag]() {
        return 'FixedHardpoint'
    }

    readonly kind = 'directory'
    readonly filename: string = 'Fixed'

    #position = new Position()
    #orientation = new Orientation()

    constructor(
        position = Vector.origin(),
        orientation: Quaternion.QuaternionLike | Matrix.MatrixLike = Quaternion.identity()
    ) {
        this.position = position

        if (Matrix.is(orientation)) orientation = Quaternion.fromMatrix(orientation)
        this.orientation = orientation
    }

    get position(): Vector.VectorLike {
        return Vector.copy(this.#position)
    }

    set position({ x, y, z }) {
        this.#position.x = x
        this.#position.y = y
        this.#position.z = z
    }

    get orientation(): Quaternion.QuaternionLike {
        return Quaternion.copy(this.#orientation)
    }

    set orientation(value) {
        const { x, y, z, w } = Quaternion.normalize(value)

        this.#orientation.x = x
        this.#orientation.y = y
        this.#orientation.z = z
        this.#orientation.w = w
    }

    get byteLength(): number {
        return this.#position.byteLength + this.#orientation.byteLength
    }

    read(parent: ReadableDirectory): void {
        parent.read(this.#position)
        parent.read(this.#orientation)
    }

    write(parent: WritableDirectory): void {
        parent.write(this.#position)
        parent.write(this.#orientation)
    }
}
