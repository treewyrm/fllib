import { type ReadableDirectory } from '../types.js'
import Material from './material.js'
import { type TypesOf } from '../../types.js'
import MapChannel from './channel.js'

export default class NebulaMaterial extends Material {
    static readonly types = ['Nebula', 'NebulaTwo'] as const

    type: TypesOf<typeof NebulaMaterial> = 'Nebula'

    diffuse = new MapChannel('D')

    opacity = 1

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.diffuse.read(parent)

        ;[this.opacity = this.opacity] = parent.getFile('Oc')?.readFloats() ?? []
    }
}