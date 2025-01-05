import Library from '../library.js'
import { ReadableDirectory } from '../types.js'
import AnimatedTexture from './animated.js'
import { TargaTexture } from './texture.js'

type Texture = TargaTexture | AnimatedTexture

export default class TextureLibrary extends Library<Texture> {
    readonly filename = 'Texture Library'

    create(parent: ReadableDirectory, name: string): Texture | null {
        if (AnimatedTexture.test(parent)) return new AnimatedTexture(name)
        if (TargaTexture.test(parent)) return new TargaTexture()

        return null
    }
}
