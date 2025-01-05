import { type BufferReader, type BufferWriter } from '../buffer/types.js'
import { type VectorLike, BYTES_PER_ELEMENT } from '../math/vector.js'
import { readVector, writeVector } from './utility.js'
import Hull from './hull.js'

/** Boundary volume hierarchy node. */
export default class Node {
    /** Boundary center. */
    center: VectorLike = { x: 0, y: 0, z: 0 }

    /** Boundary radius. */
    radius = 0

    /** Boundary axis multiplier. */
    axis: VectorLike = { x: 0, y: 0, z: 0 }

    /** Unknown byte (padding?). */
    unknown = 0

    /** Referenced hull. */
    hull?: Hull

    /** BSP left child. */
    left?: Node

    /** BSP right child. */
    right?: Node

    get byteLength(): number {
        return (
            BYTES_PER_ELEMENT +
            Float32Array.BYTES_PER_ELEMENT + // Radius
            Uint32Array.BYTES_PER_ELEMENT // Axis
        )
    }

    read(view: BufferReader): void {
        this.center = readVector(view)
        this.radius = view.readFloat32()

        this.axis.x = view.readUint8() / 0xfa
        this.axis.y = view.readUint8() / 0xfa
        this.axis.z = view.readUint8() / 0xfa

        this.unknown = view.readUint8()
    }

    write(view: BufferWriter): void {
        writeVector(view, this.center)

        view.writeFloat32(this.radius)

        view.writeUint8(this.axis.x * 0xfa)
        view.writeUint8(this.axis.y * 0xfa)
        view.writeUint8(this.axis.z * 0xfa)

        view.writeUint8(this.unknown)
    }
}
