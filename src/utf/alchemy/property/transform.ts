import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { type VectorLike } from '../../../math/vector.js'
import AnimatedCurveProperty from './animatedCurve.js'

export type TransformValue = {
    translation: VectorLike
    rotation: VectorLike
    scale: VectorLike
}

// TODO: Investigate TransformProperty flags bitmask in Alchemy.

export enum TransformFlags {
    None = 0,
    Unknown1 = 1 << 2,
    Unknown2 = 1 << 8,
    Unknown3 = 1 << 9,
    Unknown4 = 1 << 16,
    Unknown5 = 1 << 18,
    Default = TransformFlags.Unknown1 |
        TransformFlags.Unknown2 |
        TransformFlags.Unknown3 |
        TransformFlags.Unknown4 |
        TransformFlags.Unknown5,
    Enable = 1 << 31,
}

export class AnimatedAxis {
    x
    y
    z

    constructor(value: number) {
        this.x = new AnimatedCurveProperty(value)
        this.y = new AnimatedCurveProperty(value)
        this.z = new AnimatedCurveProperty(value)
    }

    get byteLength(): number {
        return [this.x, this.y, this.z].reduce((total, { byteLength }) => total + byteLength, 0)
    }

    at(mix: number, time: number, _flags: TransformFlags): VectorLike {
        // TransformFlags may affect how it all works.

        return {
            x: this.x.at(mix, time),
            y: this.y.at(mix, time),
            z: this.z.at(mix, time),
        }
    }

    read(view: BufferReader) {
        this.x.read(view)
        this.y.read(view)
        this.z.read(view)
    }

    write(view: BufferWriter) {
        this.x.write(view)
        this.y.write(view)
        this.z.write(view)
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
        }
    }
}

/** Animated transform property. */
export default class TransformProperty {
    static readonly type = 0x105
    static readonly typeName = 'transform'

    flags = TransformFlags.Default

    translation = new AnimatedAxis(0)
    rotation = new AnimatedAxis(0)
    scale = new AnimatedAxis(1)

    value: TransformValue = {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
    }

    get enabled() {
        return (this.flags & TransformFlags.Enable) >>> 0 > 0
    }

    get byteLength() {
        const { enabled, translation, rotation, scale } = this
        const byteLength = enabled
            ? [translation, rotation, scale].reduce(
                  (length, { x, y, z }) => length + x.byteLength + y.byteLength + z.byteLength,
                  0
              )
            : 0

        return Uint32Array.BYTES_PER_ELEMENT + byteLength
    }

    at(mix: number, time: number): TransformValue {
        return (this.value = {
            translation: this.translation.at(mix, time, this.flags),
            rotation: this.rotation.at(mix, time, this.flags),
            scale: this.scale.at(mix, time, this.flags),
        })
    }

    read(view: BufferReader) {
        this.flags = view.readUint32()
        if (!this.enabled) return

        this.translation.read(view)
        this.rotation.read(view)
        this.scale.read(view)
    }

    write(view: BufferWriter) {
        view.writeUint32(this.flags)
        if (!this.enabled) return

        this.translation.write(view)
        this.rotation.write(view)
        this.scale.write(view)
    }

    toJSON() {
        return {
            flags: this.flags,
            translation: this.enabled ? this.translation : undefined,
            rotation: this.enabled ? this.rotation : undefined,
            scale: this.enabled ? this.scale : undefined,
        }
    }
}
