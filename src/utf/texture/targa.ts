import { BufferReader, BufferWriter, Readable, Writable } from '../../buffer/types.js'
// import { TargaTexture, TextureType } from './texture.js'

enum ImageType {
    EMPTY,
    COLORMAP, // Palettized.
    TRUECOLOR,
    GRAYSCALE,
    RLE_PALETTE = 9,
    RLE_TRUECOLOR = 10,
    RLE_GRAYSCALE = 11,
}

class TargaHeader implements Readable, Writable {
    colorMapType = 0
    imageType: ImageType = 0
    colorMapOrigin = 0
    colorMapEntryCount = 0
    colorMapEntryLength = 0
    originX = 0
    originY = 0
    width = 0
    height = 0
    depth = 0
    descriptor = 0
    imageId = ''

    get byteLength() {
        return 18 + this.imageId.length
    }

    get pixelDepth() {
        return this.imageType === ImageType.COLORMAP ? this.colorMapEntryLength : this.depth
    }

    read(view: BufferReader) {
        const idLength = view.readUint8()

        this.colorMapType = view.readUint8()
        this.imageType = view.readUint8()
        this.colorMapOrigin = view.readUint16()
        this.colorMapEntryCount = view.readUint16()
        this.colorMapEntryLength = view.readUint8()
        this.originX = view.readUint16()
        this.originY = view.readUint16()
        this.width = view.readUint16()
        this.height = view.readUint16()
        this.depth = view.readUint8()
        this.descriptor = view.readUint8()
        this.imageId = view.slice(idLength).readZString()
    }

    write(view: BufferWriter) {
        const idLength = Math.min(this.imageId.length, 0xff)

        view.writeUint8(idLength)
        view.writeUint8(this.colorMapType)
        view.writeUint8(this.imageType)
        view.writeUint16(this.colorMapOrigin)
        view.writeUint16(this.colorMapEntryCount)
        view.writeUint8(this.colorMapEntryLength)
        view.writeUint16(this.originX)
        view.writeUint16(this.originY)
        view.writeUint16(this.width)
        view.writeUint16(this.height)
        view.writeUint8(this.depth)
        view.writeUint8(this.descriptor)
        view.slice(idLength).writeZString(this.imageId)
    }
}

export default class Targa implements Readable, Writable {
    readonly header = new TargaHeader()

    public colorMap?: Uint8Array
    public image?: Uint8Array

    get width() {
        return this.header.width
    }

    get height() {
        return this.header.height
    }

    get depth() {
        return this.header.pixelDepth
    }

    get byteLength() {
        return this.header.byteLength + (this.colorMap?.byteLength ?? 0) + (this.image?.byteLength ?? 0)
    }

    get bitmap() {
        const { width, height, depth } = this
        const bitmap = new Uint8Array((width * height * depth) >> 3)

        switch (this.header.imageType) {
            case ImageType.COLORMAP:
                return bitmap
            case ImageType.TRUECOLOR:
                if (!this.image) throw new Error('Missing image data.')

                for (let p = 0, i = 0; p < bitmap.length; p += depth >> 3) {
                    bitmap[i++] = this.image[p + 2]! // Red
                    bitmap[i++] = this.image[p + 1]! // Green
                    bitmap[i++] = this.image[p]! // Blue

                    if (depth === 32) bitmap[i++] = this.image[p + 3]! // Alpha
                }

                return bitmap
            case ImageType.GRAYSCALE:
                return bitmap
            default:
                throw new TypeError('Unsupported Targa image type.')
        }
    }

    read(view: BufferReader) {
        this.header.read(view)

        const { colorMapType, colorMapEntryLength, colorMapEntryCount, depth, width, height } = this.header
        const pixelCount = width * height

        // Read color map.
        if (colorMapType > 0)
            view.readBuffer((this.colorMap = new Uint8Array((colorMapEntryCount * colorMapEntryLength) >> 3)))

        view.readBuffer((this.image = new Uint8Array((pixelCount * depth) >> 3)))
    }

    write(view: BufferWriter) {
        this.header.write(view)

        if (this.colorMap) view.writeBuffer(this.colorMap)
        if (this.image) view.writeBuffer(this.image)
    }

    // /**
    //  * Create mipmapped texture from sequence of Targa images.
    //  * Images must be sorted in descending order: each subsequent image half the resolution of previous.
    //  * @param images
    //  * @returns
    //  */
    // static createTexture(images: Iterable<Targa>) {
    //     let texture: TargaTexture | undefined

    //     for (const { width, height, depth, bitmap } of images) {
    //         if (!texture) {
    //             if (width <= 0 || height <= 0)
    //                 throw new RangeError(`Invalid texture image resolution: ${width}x${height}.`)

    //             // if (!isPow2(width) || !isPow2(height))
    //             //     throw new RangeError(`NPOT texture image resolution: ${width}x${height}.`)

    //             let type: TextureType

    //             switch (depth) {
    //                 case 16:
    //                     type = TextureType.RGBA16_5551
    //                     break
    //                 case 24:
    //                     type = TextureType.RGB24_888
    //                     break
    //                 case 32:
    //                     type = TextureType.RGBA32_8888
    //                     break
    //                 default:
    //                     throw new RangeError(`Unsupported image color depth: ${depth}.`)
    //             }

    //             texture = new TargaTexture() //width, height, type)
    //             texture.width = width
    //             texture.height = height
    //             texture.type = type
    //         }

    //         // Skip bitmaps which aren't half the size of last mipmap.
    //         if (
    //             width !== texture.width >> texture.mipmaps.length ||
    //             height !== texture.height >> texture.mipmaps.length
    //         )
    //             continue

    //         texture.levels.push(bitmap)
    //     }

    //     return texture
    // }
}
