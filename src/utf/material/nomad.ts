import { type ReadableDirectory } from '../types.js'
import Material from './material.js'
import { type TypesOf } from '../../types.js'
import MapChannel from './channel.js'

export default class NomadMaterial extends Material {
    static readonly types = ['NomadMaterial', 'NomadMaterialNoBendy'] as const

    type: TypesOf<typeof NomadMaterial> = 'NomadMaterial'

    diffuse = new MapChannel('D')
    nomad = new MapChannel('N')

    opacity = 1

    constructor() {
        super()
        this.nomad.name = 'NomadRGB1_NomadAlpha1'
    }

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.diffuse.read(parent)
        this.nomad.read(parent)
        ;[this.opacity = this.opacity] = parent.getFile('Oc')?.readFloats() ?? []
    }
}
