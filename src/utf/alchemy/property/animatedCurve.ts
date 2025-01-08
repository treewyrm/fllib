import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Scalar, Vector } from '../../../math/index.js'
import { Easing, ease } from '../easing.js'
import { type AnimatedProperty } from '../types.js'
import { sortProperty } from '../utility.js'
import { wrap, WrapFlags } from '../wrap.js'

type Keyframe<T> = Animation.Keyframe<T>

export interface AnimatedCurve {
    defaultValue: number
    flags: WrapFlags
    keyframes: Keyframe<Vector.VectorLike>[]
}

/** Animated curve property (typically used for absolute time). */
export default class AnimatedCurveProperty implements AnimatedProperty<AnimatedCurve> {

    /**
     * Evaluate hermite animation at key.
     * @param animation 
     * @param key 
     * @returns 
     */
    static at({ keyframes, flags, defaultValue }: AnimatedCurve, key: number, count = 0): number {
        const first = keyframes.at(0)
        const last = keyframes.at(-1)
    
        if (!first || !last) return defaultValue
        if (first === last) return first.value.x
    
        ;[key, count] = wrap(key, first.key, last.key, flags)
        if (key > last.key) key = first.key
    
        const [start, end, weight] = Animation.at(keyframes, key)
        return Scalar.hermite(start.x, start.z, end.x, end.y, weight) + (last.value.x - first.value.x) * count
    }

    static readonly type = 0x202
    static readonly typeName = 'animated-curve'

    keyframes: Keyframe<AnimatedCurve>[] = []
    easing = Easing.EaseBoth

    constructor(defaultValue = 0) {
        this.keyframes = [
            {
                key: 0,
                value: {
                    defaultValue,
                    flags: WrapFlags.AfterRepeat,
                    keyframes: [],
                },
            },
        ]
    }

    get byteLength() {
        return (
            Uint8Array.BYTES_PER_ELEMENT + // Param easing.
            Uint8Array.BYTES_PER_ELEMENT + // Param count.
            this.keyframes.reduce(
                (total, { value: { keyframes } }) =>
                    total +
                    Float32Array.BYTES_PER_ELEMENT + // Param key.
                    Float32Array.BYTES_PER_ELEMENT + // Keyframe default value.
                    Uint16Array.BYTES_PER_ELEMENT + // Keyframe wrap flags.
                    Uint16Array.BYTES_PER_ELEMENT + // Keyframe count.
                    keyframes.length * 4 * Float32Array.BYTES_PER_ELEMENT, // Keyframes.
                0
            )
        )
    }

    at(parameter: number, time: number): number {
        const [start, end, weight] = Animation.at(this.keyframes, parameter)

        const a = AnimatedCurveProperty.at(start, time)
        const b = AnimatedCurveProperty.at(end, time)

        return Scalar.linear(a, b, ease(weight, this.easing))
    }

    read(view: BufferReader): void {
        this.easing = view.readUint8()
        this.keyframes = []

        for (let i = 0, length = view.readUint8(); i < length; i++) {
            const key = view.readFloat32()
            const defaultValue = view.readFloat32()
            const flags = view.readUint16()
            const keyframes = []

            for (let i = 0, length = view.readUint16(); i < length; i++)
                keyframes[i] = {
                    key: view.readFloat32(),
                    value: {
                        x: view.readFloat32(),
                        y: view.readFloat32(),
                        z: view.readFloat32(),
                    },
                }

            this.keyframes[i] = { key, value: { defaultValue, flags, keyframes } }
        }
    }

    write(view: BufferWriter): void {
        if (!this.keyframes.length) throw new RangeError(`Animated curve has no parameter keyframes.`)

        sortProperty(this)

        view.writeUint8(this.easing ?? Easing.None)
        view.writeUint8(this.keyframes.length)

        for (const {
            key,
            value: { defaultValue, flags, keyframes },
        } of this.keyframes) {
            // Animated curve parameter is allowed to have zero keyframes (evaluation falls back to defaultValue).

            view.writeFloat32(key)
            view.writeFloat32(defaultValue ?? 0)
            view.writeUint16(flags ?? WrapFlags.None)
            view.writeUint16(keyframes.length)

            for (const {
                key,
                value: { x, y, z },
            } of keyframes) {
                view.writeFloat32(key)
                view.writeFloat32(x)
                view.writeFloat32(y)
                view.writeFloat32(z)
            }
        }
    }

    toJSON() {
        return {
            easing: this.easing,
            keyframes: this.keyframes,
        }
    }
}
