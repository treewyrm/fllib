import { repeat } from '../../math/scalar.js'
import { Resource } from '../library.js'
import { type ReadableDirectory, type WritableDirectory } from '../types.js'

export type Frame = {
    index: number
    startU: number
    startV: number
    endU: number
    endV: number
}

export default class AnimatedTexture implements Resource {
    readonly kind = 'directory'

    /** Animation frame rate. */
    rate = 15

    /** Animation keyframes. */
    keyframes: Frame[] = []

    constructor(
        /** Texture set name. Frame texture: `${name}_${Frame.index}` */
        public name: string
    ) {}

    static test(parent: ReadableDirectory): boolean {
        return !!parent.getFile('Frame rects')
    }

    get byteLength(): number {
        return Uint32Array.BYTES_PER_ELEMENT + Float32Array.BYTES_PER_ELEMENT + this.frameByteLength
    }

    get frameByteLength(): number {
        return Uint32Array.BYTES_PER_ELEMENT * 5 * this.keyframes.length
    }

    at(time: number): Frame {
        /** Duration in milliseconds. */
        const duration = this.keyframes.length * this.rate * 1000

        const index = Math.floor(repeat(time / duration) * this.keyframes.length)
        const frame = this.keyframes.at(index)
        if (!frame) throw new RangeError('Invalid texture animation frame index')

        return frame
    }

    read(parent: ReadableDirectory): void {
        const [count = 0] = parent.getFile('Frame count')?.readIntegers() ?? []
        ;[this.rate = 15] = parent.getFile('FPS')?.readFloats() ?? []

        const view = parent.getFile('Frame rects')?.view
        if (!view) throw new RangeError(`Missing frame rects file in animated texture`)

        this.keyframes.length = count

        for (let i = 0; i < count; i++) {
            this.keyframes[i] = {
                index: view.readUint32(),
                startU: view.readFloat32(),
                startV: view.readFloat32(),
                endU: view.readFloat32(),
                endV: view.readFloat32(),
            }
        }
    }

    write(parent: WritableDirectory): void {
        parent.setFile('FPS').writeFloats(this.rate)
        parent.setFile('Frame count').writeIntegers(this.keyframes.length)

        const rectangles = parent.setFile('Frame rects')
        rectangles.byteLength = this.frameByteLength

        const view = rectangles.view

        for (const { index, startU, startV, endU, endV } of this.keyframes) {
            view.writeUint32(index)
            view.writeFloat32(startU)
            view.writeFloat32(startV)
            view.writeFloat32(endU)
            view.writeFloat32(endV)
        }
    }
}
