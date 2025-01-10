import { Vector } from '../../math/index.js'
import { type ReadableFile, type WritableFile } from '../types.js'

export type MaterialType<T> = T extends { types: infer V } ? (V extends readonly unknown[] ? V[number] : never) : never

export const readVector = (file?: ReadableFile): Vector.VectorLike | undefined => {
    const [x, y, z] = file?.readFloats() ?? []
    return x && y && z ? { x, y, z } : undefined
}

export const writeVector = (file: WritableFile, { x, y, z }: Vector.VectorLike) => file.writeFloats(x, y, z)
