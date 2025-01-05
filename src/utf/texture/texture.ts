import { getByteLength } from '../../buffer/utility.js'
import { Resource } from '../library.js'
import { ReadableDirectory, WritableDirectory } from '../types.js'

export enum TextureType {
    NONE,

    /** Format: `ALPHA` Type: `UNSIGNED_BYTE` */
    ALPHA_8,

    /** Format: `LUMINANCE_ALPHA` Type: `UNSIGNED_BYTE` */
    LUMINANCEALPHA_88,

    /** Format: `RGB` Type: `UNSIGNED_SHORT_5_6_5` */
    RGB16_565,

    /** Format: `RGBA` Type: `UNSIGNED_SHORT_4_4_4_4` */
    RGBA16_4444,

    /** Format: `RGBA` Type: `UNSIGNED_SHORT_5_5_5_1` */
    RGBA16_5551,

    /** Format: `RGB` Type: `UNSIGNED_BYTE` */
    RGB24_888,

    /** Format: `RGBA` Type: `UNSIGNED_BYTE` */
    RGBA32_8888,

    /** Format: `COMPRESSED_RGB_S3TC_DXT1_EXT` */
    S3TC_DXT1,

    /** Format: `COMPRESSED_RGBA_S3TC_DXT1_EXT` */
    S3TC_DXT1A,

    /** Format: `COMPRESSED_RGBA_S3TC_DXT3_EXT` */
    S3TC_DXT3,

    /** Format: `COMPRESSED_RGBA_S3TC_DXT5_EXT` */
    S3TC_DXT5,
}

export class TargaTexture implements Resource {
    readonly kind = 'directory'

    levels: ArrayBuffer[] = []

    get byteLength() {
        return getByteLength(...this.levels)
    }

    static test(parent: ReadableDirectory): boolean {
        return !!parent.getFile('MIP0')
    }

    read(directory: ReadableDirectory): void {
        const { levels } = this
        levels.length = 0

        for (let index = 0;;index++) {
            const file = directory.getFile(`MIP${index}`)
            if (!file) break

            levels[index] = file.data.slice()
        }
    }

    write(directory: WritableDirectory): void {
        const { levels } = this

        for (let index = 0; index < levels.length; index++) {
            const data = this.levels[index]
            if (!data) break

            directory.setFile(`MIP${index}`).data = data.slice()
        }
    }
}
