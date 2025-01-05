import { type BufferReader, type BufferWriter } from '../buffer/types.js'
import type Face from './face.js'

export enum Type {
    Enabled = 4,
    Skip = 5,
}

/** Convex hull element of a surface part. */
export default class Hull {
    /**
     * ID/offset.
     * - Model part ID when flags is 4.
     * - It may have a id different from the surface part it belongs to.
     * - Offset to node when hull flags is 5.
     */
    id = 0

    /** Hull flag determines state (4 = enabled, 5 = skip). */
    flags = 4

    /** Hull faces. */
    faces: Face[] = []

    unknown = 0

    get byteLength(): number {
        return (
            Uint32Array.BYTES_PER_ELEMENT + // ID.
            Uint32Array.BYTES_PER_ELEMENT + // Hull header.
            Uint32Array.BYTES_PER_ELEMENT + // Faces header.
            this.faces.length *
                (Uint32Array.BYTES_PER_ELEMENT + // Face header.
                    Uint32Array.BYTES_PER_ELEMENT * 3) // Opposite edge offset and flag (MSB).
        )
    }

    get indexCount(): number {
        return (12 + this.faces.length * 6) / 4
    }

    getIndices(): number[] {
        return [...new Set(this.faces.flatMap((face) => face.edges))]
    }

    read(view: BufferReader): void {
        this.id = view.readUint32()
        const hull = view.readUint32() // Hull header.
        this.flags = hull & 0xff

        const indexCount = hull >> 8
        this.faces.length = view.readUint16()
        this.unknown = view.readUint16()

        let longCount = 0

        for (let i = 0; i < this.faces.length; i++) {
            /** Flag (8 bits), opposite face index (12 bits unsigned), face index (12 bits unsigned). */
            const header = view.readUint32()

            /** Face index. */
            const index = header & 0xfff

            const face: Face = (this.faces[index] = {
                flag: (header >> 24) & 0xff,
                opposite: (header >> 12) & 0xfff,
                edges: [0, 0, 0],
                adjacent: [0, 0, 0],
                state: [false, false, false],
            })

            for (let v = 0; v < 3; v++) {
                face.edges[v] = view.readUint16()

                /** Edge flag (1 bit), offset to opposite side (signed 15-bit integer). */
                let data = view.readUint16()
                face.state[v] = data >> 15 > 0

                data &= 0x7fff

                // This is retarded but it just works, okay?
                const edgeOffset = longCount + (data >> 14 > 0 ? (data & 0x3fff) | ~0x3fff : data & 0x3fff)
                face.adjacent[v] = Math.ceil(edgeOffset - edgeOffset / 4)

                longCount++
            }

            longCount++
        }

        if (this.indexCount !== indexCount) throw new RangeError('Invalid hull index count')
    }

    write(view: BufferWriter): void {
        view.writeUint32(this.id)
        view.writeUint32((this.indexCount << 8) | (this.flags & 0xff))
        view.writeUint16(this.faces.length)
        view.writeUint16(this.unknown)

        let count = 0

        for (const [index, face] of this.faces.entries()) {
            view.writeUint32((index & 0xfff) | ((face.opposite & 0xfff) << 12) | ((face.flag & 0xff) << 24))

            for (let v = 0; v < 3; v++) {
                let edgeOffset = (face.adjacent[v]! - count + face.adjacent[v]! / 3 - count / 3) & 0x7fff
                if (face.state) edgeOffset |= 0x8000 // Set MSB.

                view.writeUint16(face.edges[v]!)
                view.writeUint16(edgeOffset)
                count++
            }
        }
    }
}
