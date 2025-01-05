import { type BufferReader, type BufferWriter } from '../../buffer/types.js'
import { Box, Sphere } from '../../math/index.js'
import { readVector, writeVector } from '../utility.js'

export default class VMeshRef {
    static JSONKind = 'vmesh-reference'

    readonly kind = 'file'

    readonly byteLength = 60

    /** Mesh buffer id. */
    meshId = 0

    /** Vertex attributes start index. */
    vertexStart = 0

    /** Vertex attributes count. */
    vertexCount = 0

    /** Elements start index. */
    indexStart = 0

    /** Elements count. */
    indexCount = 0

    /** Mesh group start index. */
    groupStart = 0

    /** Mesh group count. */
    groupCount = 0

    /** Bounding box. */
    boundingBox = Box.origin()

    /** Bounding sphere. */
    boundingSphere = Sphere.origin()

    read(view: BufferReader) {
        if (view.readUint32() !== this.byteLength) throw new RangeError('Invalid VMeshRef size.')
        this.meshId = view.readInt32()

        // Read offsets and counts.
        this.vertexStart = view.readUint16()
        this.vertexCount = view.readUint16()
        this.indexStart = view.readUint16()
        this.indexCount = view.readUint16()
        this.groupStart = view.readUint16()
        this.groupCount = view.readUint16()

        // Read bounding box.
        const { minimum, maximum } = this.boundingBox

        maximum.x = view.readFloat32()
        minimum.x = view.readFloat32()
        maximum.y = view.readFloat32()
        minimum.y = view.readFloat32()
        maximum.z = view.readFloat32()
        minimum.z = view.readFloat32()

        // Read bounding sphere.
        this.boundingSphere.center = readVector(view)
        this.boundingSphere.radius = view.readFloat32()
    }

    write(view: BufferWriter) {
        view.writeUint32(this.byteLength)
        view.writeInt32(this.meshId)

        // Write offsets and counts.
        view.writeUint16(this.vertexStart)
        view.writeUint16(this.vertexCount)
        view.writeUint16(this.indexStart)
        view.writeUint16(this.indexCount)
        view.writeUint16(this.groupStart)
        view.writeUint16(this.groupCount)

        // Write bounding box.
        const { minimum, maximum } = this.boundingBox

        view.writeFloat32(maximum.x)
        view.writeFloat32(minimum.x)
        view.writeFloat32(maximum.y)
        view.writeFloat32(minimum.y)
        view.writeFloat32(maximum.z)
        view.writeFloat32(minimum.z)

        // Write bounding sphere.
        writeVector(view, this.boundingSphere.center)
        view.writeFloat32(this.boundingSphere.radius)
    }

    toJSON() {
        return {
            kind: 'vmeshref' as const,
            meshId: this.meshId,
            vertexStart: this.vertexStart,
            vertexCount: this.vertexCount,
            indexStart: this.indexStart,
            indexCount: this.indexCount,
            groupStart: this.groupStart,
            groupCount: this.groupCount,
            boundingBox: this.boundingBox,
            boundingSphere: this.boundingSphere,
        }
    }
}
