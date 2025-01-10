import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import { type TypesOf } from '../../types.js'
import { Vector } from '../../math/index.js'
import { Flags } from './channel.js'
import Material from './material.js'
import { readVector, writeVector } from './utility.js'

export default class SinglePassMaterial extends Material {
    static readonly types = [
        'Dc',
        'DcDt',
        'DcDtTwo',
        'DcDtEc',
        'DcDtEcTwo',
        'DcDtEcEt',
        'DcDtOcOt',
        'DcDtOcOtTwo',
        'DcDtEcOcOt',
        'DcDtEcOcOtTwo',
        'EcEt',
        'DcDtEt',
        'DcDtEtTwo',
        'HUDIconMaterial',
        'HUDAnimMaterial',
        'PlanetWaterMaterial',
        'ExclusionZoneMaterial',
        'NullMaterial',
    ] as const

    type: TypesOf<typeof SinglePassMaterial> = 'DcDt'

    /** Emission color (`Ec`) */
    emissionColor?: Vector.VectorLike

    /** Emission texture name (`Et_name`) */
    emissionTextureName?: string

    /** Emission texture flags (`Et_flags`) */
    emissionTextureFlags?: Flags

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.emissionColor = readVector(parent.getFile('Ec'))
        this.emissionTextureName = parent.getFile('Et_name')?.readString()
        this.emissionTextureFlags = parent.getFile('Et_flags')?.readInteger()
    }

    write(parent: WritableDirectory): void {
        super.write(parent)

        if (this.emissionColor) writeVector(parent.setFile('Ec'), this.emissionColor)
        if (this.emissionTextureName) parent.setFile('Et_name').writeStrings(this.emissionTextureName)
        if (this.emissionTextureFlags) parent.setFile('Et_flags').writeIntegers(this.emissionTextureFlags)
    }
}
