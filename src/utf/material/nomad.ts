import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import { type TypesOf } from '../../types.js'
import { Flags } from './channel.js'
import Material from './material.js'

export default class NomadMaterial extends Material {
    static readonly types = ['NomadMaterial', 'NomadMaterialNoBendy'] as const

    static readonly defaultNomadTextureName = 'NomadRGB1_NomadAlpha1'

    type: TypesOf<typeof NomadMaterial> = 'NomadMaterial'

    /** Nomad texture name (`Nt_name`) */
    nomadTextureName?: string

    /** Nomad texture flags (`Nt_flags`) */
    nomadTextureFlags?: Flags

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.nomadTextureName = parent.getFile('Nt_name')?.readString()
        this.nomadTextureFlags = parent.getFile('Nt_flags')?.readInteger()
    }

    write(parent: WritableDirectory): void {
        super.write(parent)

        if (this.nomadTextureName) parent.setFile('Nt_name').writeStrings(this.nomadTextureName)
        if (this.nomadTextureFlags) parent.setFile('Nt_flags').writeIntegers(this.nomadTextureFlags)
    }
}
