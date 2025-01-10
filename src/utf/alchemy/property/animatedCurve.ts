import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Scalar, Vector } from '../../../math/index.js'
import { readVector, writeVector } from '../../utility.js'
import { Easing, ease } from '../easing.js'
import { type AnimatedProperty } from '../types.js'
import { wrap, WrapFlags } from '../wrap.js'

type Keyframe<T> = Animation.Keyframe<T>

type Point = Vector.VectorLike

export interface AnimatedCurve {
    defaultValue: number
    flags: WrapFlags
    keyframes: Keyframe<Point>[]
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
        ;[key, count] = wrap(flags, first.key, last.key, key)
        if (key > last.key) key = first.key

        const [{ x: start, z: after }, { x: end, y: before }, weight] = Animation.at(keyframes, key)
        return Scalar.hermite(start, after, end, before, weight) + (last.value.x - first.value.x) * count
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
        const { keyframes, easing } = this

        if (!keyframes.length) throw new RangeError('Animated curve property is missing keyframe data')

        const [start, end, weight] = Animation.at(keyframes, parameter)

        const a = AnimatedCurveProperty.at(start, time)
        if (start === end) return a

        const b = AnimatedCurveProperty.at(end, time)
        if (a === b) return a

        return Scalar.linear(a, b, ease(weight, easing))
    }

    static *readKeyframes(view: BufferReader): Generator<Keyframe<Point>> {
        for (let count = view.readUint16(); count > 0; count--)
            yield {
                key: view.readFloat32(),
                value: readVector(view),
            }
    }

    static *readParameters(view: BufferReader): Generator<Keyframe<AnimatedCurve>> {
        for (let count = view.readUint8(); count > 0; count--)
            yield {
                key: view.readFloat32(),
                value: {
                    defaultValue: view.readFloat32(),
                    flags: view.readUint16(),
                    keyframes: [...AnimatedCurveProperty.readKeyframes(view)],
                },
            }
    }

    read(view: BufferReader): void {
        this.easing = view.readUint8()
        this.keyframes = [...AnimatedCurveProperty.readParameters(view)]
    }

    static writeKeyframes(view: BufferWriter, keyframes: Keyframe<Point>[]): void {
        view.writeUint16(keyframes.length)

        for (const { key, value } of keyframes) {
            view.writeFloat32(key)
            writeVector(view, value)
        }
    }

    static writeParameters(view: BufferWriter, parameters: Keyframe<AnimatedCurve>[]): void {
        view.writeUint8(parameters.length)

        for (const { key, value: { defaultValue, flags, keyframes } } of parameters) {
            view.writeFloat32(key)
            view.writeFloat32(defaultValue)
            view.writeUint16(flags)
            this.writeKeyframes(view, keyframes)
        }
    }

    write(view: BufferWriter): void {
        view.writeUint8(this.easing)
        AnimatedCurveProperty.writeParameters(view, this.keyframes)
    }

    toJSON() {
        return {
            easing: this.easing,
            keyframes: this.keyframes,
        }
    }
}
