import { type BufferReader, type BufferWriter } from '../../buffer/types.js'

export default class VWireData {
    readonly kind = 'file'

    /** Block header size. */
    readonly size = 0x10

    /** Mesh buffer id. */
    meshId = 0

    /** Vertex attributes start index. */
    vertexStart = 0

    /** Vertex attributes count. */
    vertexCount = 0

    /** Used vertices count. */
    vertexRange = 0

    /** Wireframe element (LineList) indices. */
    indices = new Uint16Array()

    get byteLength() {
        return this.size + this.indices.byteLength
    }

    read(view: BufferReader) {
        if (view.readUint32() !== this.size) throw new RangeError('Invalid VWireData size.')
        this.meshId = view.readInt32()

        this.vertexStart = view.readUint16()
        this.vertexCount = view.readUint16()
        this.indices = new Uint16Array(view.readUint16())
        this.vertexRange = view.readUint16()

        for (let i = 0; i < this.indices.length; i++) this.indices[i] = view.readUint16()
    }

    write(view: BufferWriter) {
        view.writeUint32(this.size)
        view.writeInt32(this.meshId)

        view.writeUint16(this.vertexStart)
        view.writeUint16(this.vertexCount)
        view.writeUint16(this.indices.length)
        view.writeUint16(this.vertexRange)

        for (let i = 0; i < this.indices.length; i++) view.writeUint16(this.indices[i]!)
    }

    toJSON() {
        const lines: [start: number, end: number][] = []

        for (let i = 0; i < this.indices.length; i += 2)
            lines.push([this.indices[i]!, this.indices[i + 1]!])

        return {
            kind: 'vwiredata' as const,
            meshId: this.meshId,
            vertexStart: this.vertexStart,
            vertexCount: this.vertexCount,
            vertexRange: this.vertexRange,
            lines
        }
    }
}
