import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import { type TypesOf } from '../../types.js'
import { Vector } from '../../math/index.js'
import { Flags } from './channel.js'
import Material from './material.js'
import { readVector, writeVector } from './utility.js'

export default class TwoPassMaterial extends Material {
    static readonly types = [
        'DetailMapMaterial',
        'IllumDetailMapMaterial',
        'Masked2DetailMapMaterial',
        'DetailMap2Dm1Msk2PassMaterial',
    ] as const

    type: TypesOf<typeof TwoPassMaterial> = 'DetailMapMaterial'

    /** Ambient color (`Ac`) */
    ambientColor?: Vector.VectorLike

    /** Diffuse mask 0 texture (`Dm0_name`) */
    diffuseMask0TextureName?: string

    /** Diffuse mask 0 texture flags (`Dm0_flags`) */
    diffuseMask0TextureFlags?: Flags

    /** Diffuse mask 0 texture tile rate (`TileRate0`) */
    tileRate0?: number

    /** Diffuse mask 1 texture (`Dm1_name`) */
    diffuseMask1TextureName?: string

    /** Diffuse mask 1 texture flags (`Dm1_flags`) */
    diffuseMask1TextureFlags?: Flags

    /** Diffuse mask 1 texture tile rate (`TileRate1`) */
    tileRate1?: number

    /** Flip textures by U (`flip u`) */
    flipU?: number

    /** Flip textures by V (`flip v`) */
    flipV?: number

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.ambientColor = readVector(parent.getFile('Ac'))
        
        this.diffuseMask0TextureName = parent.getFile('Dm0_name')?.readString()
        this.diffuseMask0TextureFlags = parent.getFile('Dm0_flags')?.readInteger()

        this.diffuseMask1TextureName = parent.getFile('Dm1_name')?.readString()
        this.diffuseMask1TextureFlags = parent.getFile('Dm1_flags')?.readInteger()

        this.tileRate0 = parent.getFile('TileRate0')?.readFloat()
        this.tileRate1 = parent.getFile('TileRate1')?.readFloat()

        this.flipU = parent.getFile('flip u')?.readInteger()
        this.flipV = parent.getFile('flip v')?.readInteger()
    }

    write(parent: WritableDirectory): void {
        super.write(parent)

        if (this.ambientColor) writeVector(parent.setFile('Ac'), this.ambientColor)

        if (this.diffuseMask0TextureName) parent.setFile('Dm0_name').writeStrings(this.diffuseMask0TextureName)
        if (this.diffuseMask0TextureFlags) parent.setFile('Dm0_flags').writeIntegers(this.diffuseMask0TextureFlags)

        if (this.diffuseMask1TextureName) parent.setFile('Dm1_name').writeStrings(this.diffuseMask1TextureName)
        if (this.diffuseMask1TextureFlags) parent.setFile('Dm1_flags').writeIntegers(this.diffuseMask1TextureFlags)
            
        if (this.tileRate0) parent.setFile('TileRate0').writeFloats(this.tileRate0)
        if (this.tileRate1) parent.setFile('TileRate1').writeFloats(this.tileRate1)

        if (this.flipU) parent.setFile('flip u').writeIntegers(this.flipU)
        if (this.flipV) parent.setFile('flip v').writeIntegers(this.flipV)
    }
}
