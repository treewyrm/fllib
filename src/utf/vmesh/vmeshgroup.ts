import { BufferReader, BufferWriter } from '../../buffer/types.js'

export default class VMeshGroup {
    readonly byteLength = 12

    /** Render material id. */
    materialId = 0

    /** Vertex attribute start index. */
    vertexStart = 0

    /** Vertex attribute end index. */
    vertexEnd = 0

    /** Element indices count. */
    elementCount = 0

    /** Unused padding byte. */
    padding = 0xcc

    get vertexCount() {
        return Math.max(0, this.vertexEnd - this.vertexStart)
    }

    read(view: BufferReader) {
        this.materialId = view.readInt32()
        this.vertexStart = view.readUint16()
        this.vertexEnd = view.readUint16()
        this.elementCount = view.readUint16()
        this.padding = view.readUint16()
    }

    write(view: BufferWriter) {
        view.writeInt32(this.materialId)
        view.writeUint16(this.vertexStart)
        view.writeUint16(this.vertexEnd)
        view.writeUint16(this.elementCount)
        view.writeUint16(this.padding)
    }
}
