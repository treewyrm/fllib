import { type ReadableDirectory } from '../types.js'
import Material from './material.js'
import { type TypesOf } from '../../types.js'
import MapChannel from './channel.js'

export default class DetailMaterial extends Material {
    static readonly types = ['BtDetailMapMaterial', 'BtDetailMapTwoMaterial'] as const

    type: TypesOf<typeof DetailMaterial> = 'BtDetailMapMaterial'

    diffuse = new MapChannel('D')
    bump = new MapChannel('B')

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.diffuse.read(parent)
        this.bump.read(parent)
    }
}