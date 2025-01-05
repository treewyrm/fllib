import { type BufferReader } from '../../buffer/types.js'
import { type Keyframe } from '../../math/animation.js'
import Library, { type Resource } from '../library.js'
import { type ReadableDirectory, type WritableDirectory } from '../types.js'

type DeltaKeyframe = Keyframe<[uPan: number, vPan: number, uScale: number, vScale: number]>
type TextureKeyframe = [xOffset: number, yOffset: number, xScale: number, yScale: number]

export class MaterialAnimation implements Resource {
    readonly kind = 'directory'

    count = 0
    flags = 0
    deltas: DeltaKeyframe[] = []
    keys: TextureKeyframe[] = []

    get byteLength() {
        return (
            Uint32Array.BYTES_PER_ELEMENT + // MACount
            Uint32Array.BYTES_PER_ELEMENT + // MAFlags
            this.deltas.length * 5 * Float32Array.BYTES_PER_ELEMENT + // MADeltas
            this.keys.length * 4 * Float32Array.BYTES_PER_ELEMENT // MAKeys
        )
    }

    static *readDeltas(view: BufferReader): Generator<DeltaKeyframe> {
        while (view.byteRemain >= 5 * Float32Array.BYTES_PER_ELEMENT)
            yield {
                key: view.readFloat32(),
                value: [view.readFloat32(), view.readFloat32(), view.readFloat32(), view.readFloat32()],
            }
    }

    static *readKeys(view: BufferReader): Generator<TextureKeyframe> {
        while (view.byteRemain >= 4 * Float32Array.BYTES_PER_ELEMENT)
            yield [view.readFloat32(), view.readFloat32(), view.readFloat32(), view.readFloat32()]
    }

    read(parent: ReadableDirectory): void {
        ;[this.count = 0] = parent.getFile('MACount')?.readIntegers() ?? []
        ;[this.flags = 0] = parent.getFile('MAFlags')?.readIntegers() ?? []

        const deltas = parent.getFile('MADeltas')
        if (deltas) this.deltas = [...MaterialAnimation.readDeltas(deltas.view)]

        const keys = parent.getFile('MAKeys')
        if (keys) this.keys = [...MaterialAnimation.readKeys(keys.view)]
    }

    write(parent: WritableDirectory): void {
        parent.setFile('MACount').writeIntegers(this.count)
        parent.setFile('MAFlags').writeIntegers(this.flags)
        parent.setFile('MADeltas').writeFloats(...this.deltas.flatMap(({ key, value }) => [key, ...value]))
        parent.setFile('MAKeys').writeFloats(...this.keys.flatMap((value) => value))
    }
}

export class MaterialAnimationLibrary extends Library<MaterialAnimation> {
    readonly filename = 'MaterialAnim'

    create(): MaterialAnimation | null {
        return new MaterialAnimation()
    }
}
