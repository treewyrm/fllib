import { type BufferReader, type BufferWriter } from '../../buffer/types.js'
import { Scalar, Vector } from '../../math/index.js'
import BufferView from '../../buffer/view.js'
import { getMapCount, getByteLength, Format, type Attributes, type UV } from './vertex.js'
import VMeshGroup from './vmeshgroup.js'
import { readVector, writeVector } from '../utility.js'

/** Direct3D primitive type (D3DPRIMITIVETYPE). */
export enum Primitive {
    None,

    /** Point list `D3DPT_POINTLIST` */
    PointList,

    /** Line list `D3DPT_LINELIST` */
    LineList,

    /** Line strip `D3DPT_LINESTRIP` */
    LineStrip,

    /** Triangle list `D3DPT_TRIANGLELIST` */
    TriangleList,

    /** Triangle strip `D3DPT_TRIANGLESTRIP` */
    TriangleStrip,

    /** Triangle fan `D3DPT_TRIANGLEFAN` */
    TriangleFan,
}

export default class VMeshData {
    readonly kind = 'file'

    /** Mesh data version?. */
    readonly type = 1

    /** Mesh primitive type. */
    primitive = Primitive.TriangleList

    /** Vertex format. */
    format = Format.Position

    /** Mesh groups. */
    groups: VMeshGroup[] = []

    /** Element indices. */
    indices = new Uint16Array()

    /** Vertex attributes. */
    vertices = new Uint8Array()

    get mapCount() {
        return getMapCount(this.format)
    }

    get vertexSize() {
        return getByteLength(this.format)
    }

    get vertexCount() {
        return this.vertices.byteLength / this.vertexSize
    }

    set vertexCount(value) {
        this.vertices = new Uint8Array(this.vertexSize * Scalar.clamp(value, 0, 0xffff))
    }

    get elementCount() {
        const { primitive, indices } = this

        switch (primitive) {
            case Primitive.PointList:
                return indices.length
            case Primitive.LineList:
                return indices.length >> 1
            case Primitive.LineStrip:
                return Math.max(0, indices.length - 1)
            case Primitive.TriangleList:
                return Math.floor(indices.length / 3)
            case Primitive.TriangleFan:
            case Primitive.TriangleStrip: // Actual amount depends on degraded triangles in the set.
                return Math.max(0, indices.length - 2)
            default:
                throw new TypeError('Invalid mesh primitive type')
        }
    }

    /** Calculate complete byte length of VMeshData block. */
    get byteLength() {
        return (
            0x10 + // Header
            this.groups.reduce((total, { byteLength }) => total + byteLength, 0) + // Groups
            this.indices.byteLength + // Indices
            this.vertices.byteLength // Vertices
        )
    }

    getVertexBufferRange(start = 0, count = this.vertexCount - start) {
        const { vertexSize } = this
        return new Uint8Array(this.vertices.buffer, start * vertexSize, count * vertexSize)
    }

    /**
     * Reads vertices from start index.
     */
    getVertices(start = 0, count = this.vertexCount - start): Attributes[] {
        const { format } = this

        let index = 0
        const view = BufferView.from(this.getVertexBufferRange(start, count))

        const vertices = Array<Attributes>(count)
        let vertex: Attributes

        while (count > index) {
            vertices[index++] = vertex = Object.create(null)

            if (format & Format.Position) vertex.position = readVector(view)
            if (format & Format.PointSize) vertex.size = view.readFloat32()
            if (format & Format.Normal) vertex.normal = readVector(view)
            if (format & Format.Diffuse) vertex.diffuse = view.readUint32()
            if (format & Format.Specular) vertex.specular = view.readUint32()

            const readUV = (): [number, number] => [view.readFloat32(), view.readFloat32()]

            if (format & Format.Texture1) vertex.uv1 = readUV()
            if (format & Format.Texture2) vertex.uv2 = readUV()
            if (format & Format.Texture3) vertex.uv3 = readUV()
            if (format & Format.Texture4) vertex.uv4 = readUV()
            if (format & Format.Texture5) vertex.uv5 = readUV()
            if (format & Format.Texture6) vertex.uv6 = readUV()
            if (format & Format.Texture7) vertex.uv7 = readUV()
            if (format & Format.Texture8) vertex.uv8 = readUV()
        }

        return vertices
    }

    /**
     * Sets vertex attribute data.
     * @param vertices
     * @param start Vertex start index.
     */
    setVertices(vertices: Attributes[], start = 0) {
        const { format } = this

        this.vertexCount = start + vertices.length
        const view = BufferView.from(this.getVertexBufferRange(start, vertices.length))

        const defaultPosition = Vector.origin()
        const defaultNormal = Vector.axisZ()

        for (const {
            position = defaultPosition,
            size = 0,
            normal = defaultNormal,
            diffuse = 0xffffff,
            specular = 0x808080,
            uv1,
            uv2,
            uv3,
            uv4,
            uv5,
            uv6,
            uv7,
            uv8,
        } of vertices) {
            if (format & Format.Position) writeVector(view, position)
            if (format & Format.PointSize) view.writeFloat32(size)
            if (format & Format.Normal) writeVector(view, normal)
            if (format & Format.Diffuse) view.writeUint32(diffuse)
            if (format & Format.Specular) view.writeUint32(specular)

            const writeUV = ([u, v]: UV = [0, 0]) => (view.writeFloat32(u), view.writeFloat32(v))

            if (format & Format.Texture1) writeUV(uv1)
            if (format & Format.Texture2) writeUV(uv2)
            if (format & Format.Texture3) writeUV(uv3)
            if (format & Format.Texture4) writeUV(uv4)
            if (format & Format.Texture5) writeUV(uv5)
            if (format & Format.Texture6) writeUV(uv6)
            if (format & Format.Texture7) writeUV(uv7)
            if (format & Format.Texture8) writeUV(uv8)
        }
    }

    read(view: BufferReader): void {
        if (view.readUint32() !== this.type) throw new RangeError('Mesh data type mismatch')
        this.primitive = view.readUint32()

        this.groups = new Array(view.readUint16())
        this.indices = new Uint16Array(view.readUint16())
        this.format = view.readUint16()
        this.vertexCount = view.readUint16()

        // Read mesh groups.
        for (let i = 0; i < this.groups.length; i++) (this.groups[i] = new VMeshGroup()).read(view)

        // Read element buffer.
        for (let i = 0; i < this.indices.length; i++) this.indices[i] = view.readUint16()

        // Read vertex buffer.
        view.readBuffer(this.vertices)
    }

    write(view: BufferWriter): void {
        view.writeUint32(this.type)
        view.writeUint32(this.primitive)

        view.writeUint16(this.groups.length)
        view.writeUint16(this.indices.length)
        view.writeUint16(this.format)
        view.writeUint16(this.vertexCount)

        // Write mesh groups.
        for (const group of this.groups) group.write(view)

        // Write element buffer.
        for (const index of this.indices) view.writeUint16(index)

        // Write vertex buffer.
        view.writeBuffer(this.vertices)
    }
}
