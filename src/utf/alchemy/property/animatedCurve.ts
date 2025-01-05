import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Scalar, Vector } from '../../../math/index.js'
import { EasingType, getEasing } from '../easing.js'
import { type AnimatedProperty, type KeyframeProperty } from '../types.js'
import { sortProperty } from '../utility.js'
import { wrap, WrapFlags } from '../wrap.js'

type Keyframe<T> = Animation.Keyframe<T>

type VectorLike = Vector.VectorLike

type AnimatedCurve = KeyframeProperty<VectorLike> & {
    defaultValue: number
    flags: WrapFlags
}

/**
 * Gets float value from keyframes at key. Keyframe value is VectorLike where:
 * - x is value
 * - y is in tangent
 * - z is out tangent
 * @param keyframes
 * @param key
 * @returns
 */
const getHermiteValueAt = <T extends VectorLike>(keyframes: Iterable<Keyframe<T>>, key: number): number => {
    const [weight, start, end] = Animation.at(keyframes, key)
    if (!start || !end) return NaN

    return Scalar.hermite(weight, start.x, start.z, end.x, end.y)
}

const atCurve = (keyframes: Keyframe<VectorLike>[], time: number, flags: WrapFlags): number | undefined => {
    const first = keyframes.at(0)
    const last = keyframes.at(-1)

    if (!first || !last) return undefined
    if (first === last) return first.value.x

    /** Value distance for single loop. A closed loop will have 0. */
    const distance = last.value.x - first.value.x
    let [key, count] = wrap(time, first.key, last.key, flags)

    if (key > last.key) key = first.key

    const value = getHermiteValueAt(keyframes, key)
    if (isNaN(value)) return undefined

    return value + distance * count
}

/** Animated curve property (typically used for absolute time). */
export default class AnimatedCurveProperty implements AnimatedProperty<number, VectorLike> {
    static readonly type = 0x202
    static readonly typeName = 'animated-curve'

    keyframes: Keyframe<AnimatedCurve>[] = []
    easing?: EasingType = EasingType.EaseBoth
    value = 0

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
        const [weight, start, end] = Animation.at(this.keyframes, parameter)
        if (!start || !end) throw new RangeError('Missing animated curve parameter keyframes')

        const a = atCurve(start.keyframes, time, start.flags) ?? start.defaultValue
        const b = atCurve(end.keyframes, time, end.flags) ?? end.defaultValue

        return (this.value = Scalar.linear(getEasing(this.easing)?.(weight) ?? weight, a, b))
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

        view.writeUint8(this.easing ?? EasingType.None)
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
