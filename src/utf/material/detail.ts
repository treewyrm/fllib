import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import { type TypesOf } from '../../types.js'
import { Flags } from './channel.js'
import Material from './material.js'

export default class DetailMaterial extends Material {
    static readonly types = ['DcDtBt', 'BtDetailMapMaterial', 'BtDetailMapTwoMaterial'] as const

    type: TypesOf<typeof DetailMaterial> = 'BtDetailMapMaterial'

    /** Bump texture name (`Bt_name`) */
    bumpTextureName?: string

    /** Bump texture flags (`Bt_flags`) */
    bumpTextureFlags?: Flags

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.bumpTextureName = parent.getFile('Bt_name')?.readString()
        this.bumpTextureFlags = parent.getFile('Bt_flags')?.readInteger()
    }

    write(parent: WritableDirectory): void {
        super.write(parent)

        if (this.bumpTextureName) parent.setFile('Bt_name').writeStrings(this.bumpTextureName)
        if (this.bumpTextureFlags) parent.setFile('Bt_flags').writeIntegers(this.bumpTextureFlags)
    }
}
