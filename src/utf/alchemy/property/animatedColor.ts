import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Scalar, Vector } from '../../../math/index.js'
import { EasingType, getEasing } from '../easing.js'
import { type AnimatedProperty, type KeyframeProperty } from '../types.js'
import { sortProperty } from '../utility.js'

type VectorLike = Vector.VectorLike

type Keyframe<T> = Animation.Keyframe<T>

type AnimatedColor = KeyframeProperty<VectorLike> & {
    easing?: EasingType
}

/**
 * Gets VectorLike value from keyframes at key.
 * @param keyframes
 * @param key
 * @param ease
 * @returns
 */
export const getVectorValueAt = <T extends VectorLike>(
    keyframes: Iterable<Keyframe<T>>,
    key: number,
    ease?: (t: number) => number
): VectorLike => {
    const [weight, start, end] = Animation.at(keyframes, key)
    if (!start || !end) return { x: NaN, y: NaN, z: NaN }

    key = ease?.(weight) ?? weight

    return {
        x: Scalar.linear(key, start.x, end.x),
        y: Scalar.linear(key, start.y, end.y),
        z: Scalar.linear(key, start.z, end.z),
    }
}

/** Animated color property (typically used for relative time, such as over a lifespan of a particle). */
export default class AnimatedColorProperty implements AnimatedProperty<VectorLike> {
    static readonly type = 0x201
    static readonly typeName = 'animated-color'

    keyframes: Keyframe<AnimatedColor>[] = [
        {
            key: 0,
            value: {
                easing: this.easing,
                keyframes: [
                    {
                        key: 0,
                        value: {
                            x: 0,
                            y: 0,
                            z: 0,
                        },
                    },
                ],
            },
        },
    ]

    easing?: EasingType = EasingType.EaseBoth
    value = { x: 0, y: 0, z: 0 }

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
                    keyframes.length * 4 * Float32Array.BYTES_PER_ELEMENT, // Keyframe key and xyz.
                0
            )
        )
    }

    at(parameter: number, time: number): VectorLike {
        const [weight, start, end] = Animation.at(this.keyframes, parameter)
        if (!start || !end) throw new RangeError('Missing animated color parameter keyframes')

        const a = getVectorValueAt(start.keyframes, time, getEasing(start.easing))
        const b = getVectorValueAt(end.keyframes, time, getEasing(end.easing))

        return (this.value = Vector.lerp(getEasing(this.easing)?.(weight) ?? weight, a, b))
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
                    value: {
                        x: view.readFloat32(),
                        y: view.readFloat32(),
                        z: view.readFloat32(),
                    },
                }

            this.keyframes[i] = { key, value: { easing, keyframes } }
        }
    }

    write(view: BufferWriter): void {
        if (!this.keyframes.length) throw new RangeError(`Animated color is missing parameter keyframes.`)

        sortProperty(this)

        view.writeUint8(this.easing ?? EasingType.None)
        view.writeUint8(this.keyframes.length)

        for (const {
            key,
            value: { easing, keyframes },
        } of this.keyframes) {
            if (!keyframes.length) throw new RangeError(`Animated color property ${key} is missing keyframes.`)

            view.writeFloat32(key)
            view.writeUint8(easing ?? EasingType.None)
            view.writeUint8(keyframes.length)

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
