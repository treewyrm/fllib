import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Scalar, Vector } from '../../../math/index.js'
import { Easing, ease } from '../easing.js'
import { type AnimatedProperty } from '../types.js'
import { sortProperty } from '../utility.js'

type VectorLike = Vector.VectorLike

type Keyframe<T> = Animation.Keyframe<T>

export interface AnimatedColor {
    easing: Easing
    keyframes: Keyframe<Vector.VectorLike>[]
}

/** Animated color property (typically used for relative time, such as over a lifespan of a particle). */
export default class AnimatedColorProperty implements AnimatedProperty<AnimatedColor> {

    /**
     * Evaluate color animation at key.
     * @param animation
     * @param key 
     * @returns 
     */
    static at({ keyframes, easing }: AnimatedColor, key: number): VectorLike {
        const [start, end, weight] = Animation.at(keyframes, key)
        key = ease(weight, easing)
    
        return {
            x: Scalar.linear(start.x, end.x, key),
            y: Scalar.linear(start.y, end.y, key),
            z: Scalar.linear(start.z, end.z, key),
        }
    }

    static readonly type = 0x201
    static readonly typeName = 'animated-color'

    easing = Easing.EaseBoth

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
        const [start, end, weight] = Animation.at(this.keyframes, parameter)

        const a = AnimatedColorProperty.at(start, time)
        const b = AnimatedColorProperty.at(end, time)

        return Vector.lerp(a, b, ease(weight, this.easing))
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

        view.writeUint8(this.easing ?? Easing.None)
        view.writeUint8(this.keyframes.length)

        for (const {
            key,
            value: { easing, keyframes },
        } of this.keyframes) {
            if (!keyframes.length) throw new RangeError(`Animated color property ${key} is missing keyframes.`)

            view.writeFloat32(key)
            view.writeUint8(easing ?? Easing.None)
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
