import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import { type TypesOf } from '../../types.js'
import Material from './material.js'

export default class NebulaMaterial extends Material {
    static readonly types = ['Nebula', 'NebulaTwo'] as const

    type: TypesOf<typeof NebulaMaterial> = 'Nebula'

    read(parent: ReadableDirectory): void {
        super.read(parent)
    }

    write(parent: WritableDirectory): void {
        super.write(parent)
    }
}