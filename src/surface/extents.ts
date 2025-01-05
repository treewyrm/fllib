import { type BufferReader, type BufferWriter } from '../buffer/types.js'
import { type VectorLike, BYTES_PER_ELEMENT } from '../math/vector.js'

/** Boundary box part section. */
export default class Extents {
    /** Boundary box minimum. */
    minimum: VectorLike = { x: 0, y: 0, z: 0 }

    /** Boundary box maximum. */
    maximum: VectorLike = { x: 0, y: 0, z: 0 }

    get byteLength(): number {
        return 2 * BYTES_PER_ELEMENT
    }

    read(view: BufferReader): void {
        const { minimum, maximum } = this

        minimum.x = view.readFloat32()
        maximum.x = view.readFloat32()
        minimum.y = view.readFloat32()
        maximum.y = view.readFloat32()
        minimum.z = view.readFloat32()
        maximum.z = view.readFloat32()
    }

    write(view: BufferWriter): void {
        const { minimum, maximum } = this

        view.writeFloat32(minimum.x)
        view.writeFloat32(maximum.x)
        view.writeFloat32(minimum.y)
        view.writeFloat32(maximum.y)
        view.writeFloat32(minimum.z)
        view.writeFloat32(maximum.z)
    }
}
