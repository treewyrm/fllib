import { type VectorLike } from '../../math/vector.js'
import { type ReadableDirectory, type ReadableFile, type WritableDirectory, type WritableFile } from '../types.js'

export type MaterialType<T> = T extends { types: infer V } ? (V extends readonly unknown[] ? V[number] : never) : never

export const readOpacity = (parent: ReadableDirectory) => parent.getFile('Oc')?.readFloats().next().value ?? 1

export const readColor = (file: ReadableFile, color: VectorLike) => [color.x = 0, color.y = 0, color.z = 0] = file.readFloats()

export const writeColor = (file: WritableFile, color: VectorLike) => file.writeFloats(color.x, color.y, color.z)

export const readChannel = (parent: ReadableDirectory, prefix: string, color?: VectorLike) => {
    if (color)
        [color.x = color.x, color.y = color.y, color.z = color.z] = parent.getFile(`${prefix}c`)?.readFloats() ?? []

    const texture = parent.getFile(`${prefix}t_name`)?.readStrings().next().value
    const flags = parent.getFile(`${prefix}t_flags`)?.readIntegers().next().value

    return { texture, flags }
}

export const writeChannel = (parent: WritableDirectory, prefix: string, color?: VectorLike, texture?: string, flags?: number) => {
    if (color)
        parent.setFile(`${prefix}c`).writeFloats(color.x, color.y, color.z)

    if (texture) parent.setFile(`${prefix}t_name`).writeStrings(texture)
    if (flags) parent.setFile(`${prefix}t_flags`).writeIntegers(flags)
}