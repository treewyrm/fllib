import { type VectorLike } from '../../math/vector.js'
import { ReadableDirectory, WritableDirectory } from '../types.js'

export enum Flags {
    None = 0,
    MirrorU = 0x1, // gl.TEXTURE_WRAP_S -> gl.MIRRORED_REPEAT
    ClampU = 0x2, // gl.TEXTURE_WRAP_S -> gl.CLAMP_TO_EDGE
    MirrorV = 0x4, // gl.TEXTURE_WRAP_T -> gl.MIRRORED_REPEAT
    ClampV = 0x8, // gl.TEXTURE_WRAP_T -> gl.CLAMP_TO_EDGE
}

export default class MapChannel<T extends string> {
    readonly kind = 'directory'

    color?: VectorLike

    name?: string
    flags?: Flags

    constructor(readonly prefix: T) {}

    read(parent: ReadableDirectory): void {
        const { color, prefix } = this

        if (color)
            [color.x = color.x, color.y = color.y, color.z = color.z] = parent.getFile(`${prefix}c`)?.readFloats() ?? []

        ;[this.name] = parent.getFile(`${prefix}t_name`)?.readStrings() ?? []
        ;[this.flags] = parent.getFile(`${prefix}t_flags`)?.readIntegers() ?? []
    }

    write(parent: WritableDirectory): void {
        const { color, prefix, name, flags } = this

        if (color)
            parent.setFile(`${prefix}c`).writeFloats(color.x, color.y, color.z)
    
        if (name) parent.setFile(`${prefix}t_name`).writeStrings(name)
        if (flags) parent.setFile(`${prefix}t_flags`).writeIntegers(flags)
    }
}
