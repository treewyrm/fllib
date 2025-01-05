import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Scalar } from '../../../math/index.js'
import { EasingType, getEasing } from '../easing.js'
import { type AnimatedProperty, type KeyframeProperty } from '../types.js'
import { sortProperty } from '../utility.js'

type Keyframe<T> = Animation.Keyframe<T>

export type AnimatedFloat = KeyframeProperty<number> & {
    easing?: EasingType
}

const getFloatValueAt = (keyframes: Iterable<Keyframe<number>>, key: number, ease?: (t: number) => number): number => {
    const [weight, start, end] = Animation.at(keyframes, key)
    if (start === undefined || end === undefined) return NaN

    return Scalar.linear(ease?.(weight) ?? weight, start, end)
}

/** Animated float property (typically used for relative time, such as over a lifespan of a particle). */
export default class AnimatedFloatProperty implements AnimatedProperty<number> {
    static readonly type = 0x200
    static readonly typeName = 'animated-float'

    value = 0

    easing?: EasingType = EasingType.EaseBoth

    keyframes: Keyframe<AnimatedFloat>[] = [
        {
            key: 0,
            value: {
                easing: this.easing,
                keyframes: [
                    {
                        key: 0,
                        value: 0,
                    },
                ],
            },
        },
    ]

    get byteLength() {
        return (
            Uint8Array.BYTES_PER_ELEMENT + // Param easing.
            Uint8Array.BYTES_PER_ELEMENT + // Param count.
            this.keyframes.reduce(
                (total, { value: { keyframes } }) =>
                    total +
                    Float32Array.BYTES_PER_ELEMENT + // Param key.
                    Uint8Array.BYTES_PER_ELEMENT + // Keyframe easing.
                    Uint8Array.BYTES_PER_ELEMENT + // Keyframe count.
                    keyframes.length * 2 * Float32Array.BYTES_PER_ELEMENT, // Keyframe key and value
                0
            )
        )
    }

    at(parameter: number, time: number): number {
        const [weight, start, end] = Animation.at(this.keyframes, parameter)
        if (!start || !end) throw new RangeError('Missing animated float parameter keyframes')

        const a = getFloatValueAt(start.keyframes, time, getEasing(start.easing))
        const b = getFloatValueAt(end.keyframes, time, getEasing(end.easing))

        return (this.value = Scalar.linear(getEasing(this.easing)?.(weight) ?? weight, a, b))
    }

    read(view: BufferReader): void {
        this.easing = view.readUint8()
        this.keyframes = []

        for (let i = 0, length = view.readUint8(); i < length; i++) {
            const key = view.readFloat32()
            const easing = view.readUint8()
            const keyframes = []

            for (let i = 0, length = view.readUint8(); i < length; i++)
                keyframes[i] = {
                    key: view.readFloat32(),
                    value: view.readFloat32(),
                }

            this.keyframes[i] = { key, value: { easing, keyframes } }
        }
    }

    write(view: BufferWriter): void {
        if (!this.keyframes.length) throw new RangeError(`Animated float is missing parameter keyframes.`)

        sortProperty(this)

        view.writeUint8(this.easing ?? EasingType.None)
        view.writeUint8(this.keyframes.length)

        for (const {
            key,
            value: { easing, keyframes },
        } of this.keyframes) {
            if (!keyframes.length) throw new RangeError(`Animated float parameter ${key} is missing keyframes.`)

            view.writeFloat32(key)
            view.writeUint8(easing ?? EasingType.None)
            view.writeUint8(keyframes.length)

            for (const { key, value } of keyframes) {
                view.writeFloat32(key)
                view.writeFloat32(value)
            }
        }
    }

    toJSON() {
        return {
            easing: this.easing,
            keyframe: this.keyframes,
        }
    }
}
