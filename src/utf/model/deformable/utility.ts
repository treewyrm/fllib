import { type BufferReader } from '../../../buffer/types.js'
import BufferView from '../../../buffer/view.js'
import { Vector } from '../../../math/index.js'
import { readVector, writeVector } from '../../utility.js'

export const readPoints = (view: BufferReader) => {
    const count = Math.floor(view.byteLength / Vector.BYTES_PER_ELEMENT)
    const points: Vector.VectorLike[] = []

    for (let i = 0; i < count; i++) points.push(readVector(view))
    return points
}

export const readUVs = (view: BufferReader) => {
    const count = Math.floor((view.byteLength / 2) * Float32Array.BYTES_PER_ELEMENT)
    const uvs: [number, number][] = []

    for (let i = 0; i < count; i++) uvs.push([view.readFloat32(), view.readFloat32()])
    return uvs
}

export const pointsToBuffer = (points: Vector.VectorLike[]): ArrayBufferLike =>
    points.reduce(
        (view, vector) => (writeVector(view, vector), view),
        BufferView.from(points.length * Vector.BYTES_PER_ELEMENT)
    ).buffer

export const uvsToBuffer = (uvs: [number, number][]): ArrayBufferLike =>
    uvs.reduce(
        (view, [u, v]) => (view.writeFloat32(u), view.writeFloat32(v), view),
        BufferView.from(uvs.length * 2 * Float32Array.BYTES_PER_ELEMENT)
    ).buffer
