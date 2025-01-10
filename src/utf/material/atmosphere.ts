import { Vector } from '../../math/index.js'
import { type TypesOf } from '../../types.js'
import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import Material from './material.js'
import { readVector, writeVector } from './utility.js'

export default class AtmosphereMaterial extends Material {
    static readonly types = ['AtmosphereMaterial'] as const

    type: TypesOf<typeof AtmosphereMaterial> = 'AtmosphereMaterial'

    /** Ambient color (`Ac`) */
    ambientColor?: Vector.VectorLike

    /** Transparency (`Alpha`) */
    alpha?: number

    /** Steep angle fade transparency (`Face`) */
    fade?: number

    /** Diffuse texture (?) scale (`Scale`) */
    scale?: number

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.ambientColor = readVector(parent.getFile('Ac'))
        this.alpha = parent.getFile('Alpha')?.readFloat()
        this.fade = parent.getFile('Fade')?.readFloat()
        this.scale = parent.getFile('Scale')?.readFloat()
    }

    write(parent: WritableDirectory): void {
        super.write(parent)

        if (this.ambientColor) writeVector(parent.setFile('Ac'), this.ambientColor)
        if (this.alpha) parent.setFile('Alpha').writeFloats(this.alpha)
        if (this.fade) parent.setFile('Fade').writeFloats(this.fade)
        if (this.scale) parent.setFile('Scale').writeFloats(this.scale)
    }
}
