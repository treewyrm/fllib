import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Scalar } from '../../../math/index.js'
import { Easing, ease } from '../easing.js'
import { type AnimatedProperty } from '../types.js'
import { sortProperty } from '../utility.js'

type Keyframe<T> = Animation.Keyframe<T>

export interface AnimatedFloat {
    easing: Easing
    keyframes: Keyframe<number>[]
}

/** Animated float property (typically used for relative time, such as over a lifespan of a particle). */
export default class AnimatedFloatProperty implements AnimatedProperty<AnimatedFloat> {

    /**
     * Evaluate animated float at key.
     * @param animation
     * @param key 
     * @returns 
     */
    static at({ keyframes, easing }: AnimatedFloat, key: number): number {
        const [start, end, weight] = Animation.at(keyframes, key)
        if (start === end) return start
    
        return Scalar.linear(start, end, ease(weight, easing))
    }

    static readonly type = 0x200
    static readonly typeName = 'animated-float'

    easing = Easing.EaseBoth

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
        const [start, end, weight] = Animation.at(this.keyframes, parameter)
        const a = AnimatedFloatProperty.at(start, time)
        if (start === end) return a

        const b = AnimatedFloatProperty.at(end, time)
        if (a === b) return a

        return Scalar.linear(a, b, ease(weight, this.easing))
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

        view.writeUint8(this.easing ?? Easing.None)
        view.writeUint8(this.keyframes.length)

        for (const {
            key,
            value: { easing, keyframes },
        } of this.keyframes) {
            if (!keyframes.length) throw new RangeError(`Animated float parameter ${key} is missing keyframes.`)

            view.writeFloat32(key)
            view.writeUint8(easing ?? Easing.None)
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
