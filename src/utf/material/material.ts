import { Vector } from '../../math/index.js'
import { Resource } from '../library.js'
import { ReadableDirectory, WritableDirectory } from '../types.js'
import { Flags } from './channel.js'
import { readVector, writeVector } from './utility.js'

/** Default fallback material. */
export default class Material implements Resource {
    readonly kind = 'directory'

    type = ''

    get byteLength(): number {
        return 0
    }

     /** Diffuse color (`Dc`) */
    diffuseColor?: Vector.VectorLike

    /** Diffuse texture name (`Dt_name`) */
    diffuseTextureName?: string

    /** Diffuse texture flags (`Dt_flags`) */
    diffuseTextureFlags?: Flags

    /** Texture opacity (`Oc`) */
    opacity?: number

    read(parent: ReadableDirectory): void {
        this.diffuseColor = readVector(parent.getFile('Dc'))
        this.diffuseTextureName = parent.getFile('Dt_name')?.readString()
        this.diffuseTextureFlags = parent.getFile('Dt_flags')?.readInteger()
        this.opacity = parent.getFile('Oc')?.readFloat()
    }

    write(parent: WritableDirectory): void {
        parent.setFile('Type').writeStrings(this.type)

        if (this.diffuseColor) writeVector(parent.setFile('Dc'), this.diffuseColor)
        if (this.diffuseTextureName) parent.setFile('Dt_name').writeStrings(this.diffuseTextureName)
        if (this.diffuseTextureFlags) parent.setFile('Dt_flags').writeIntegers(this.diffuseTextureFlags)
        if (this.opacity) parent.setFile('Oc').writeFloats(this.opacity)
    }
}
