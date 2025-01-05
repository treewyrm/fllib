import { WritableDirectory, type ReadableDirectory } from '../types.js'
import Material from './material.js'
import { type TypesOf } from '../../types.js'
import MapChannel from './channel.js'

export default class SinglePassMaterial extends Material {
    static readonly types = [
        'DcDt',
        'DcDtTwo',
        'DcDtEc',
        'DcDtEcTwo',
        'DcDtOcOt',
        'DcDtOcOtTwo',
        'DcDtEcOcOt',
        'DcDtEcOcOtTwo',
        'EcEt',
        'DcDtEt',
        'HUDIconMaterial',
        'HUDAnimMaterial',
        'PlanetWaterMaterial',
        'ExclusionZoneMaterial',
        'NullMaterial'
    ] as const

    type: TypesOf<typeof SinglePassMaterial> = 'DcDt'

    diffuse = new MapChannel('D')
    emission = new MapChannel('E')

    opacity = 1

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.diffuse.read(parent)
        this.emission.read(parent)

        ;[this.opacity = this.opacity] = parent.getFile('Oc')?.readFloats() ?? []
    }

    write(parent: WritableDirectory): void {
        super.write(parent)

        this.diffuse.write(parent)
        this.emission.write(parent)

        if (this.opacity < 1) parent.setFile('Oc').writeFloats(this.opacity)
    }
}