import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Scalar } from '../../../math/index.js'
import { Easing, ease } from '../easing.js'
import { type AnimatedProperty } from '../types.js'

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
        const { keyframes, easing } = this

        if (!keyframes.length) throw new RangeError('Animated float property is missing keyframe data')

        const [start, end, weight] = Animation.at(keyframes, parameter)

        const a = AnimatedFloatProperty.at(start, time)
        if (start === end) return a

        const b = AnimatedFloatProperty.at(end, time)
        if (a === b) return a

        return Scalar.linear(a, b, ease(weight, easing))
    }

    static *readKeyframes(view: BufferReader): Generator<Keyframe<number>> {
        for (let count = view.readUint8(); count > 0; count--)
            yield {
                key: view.readFloat32(),
                value: view.readFloat32(),
            }
    }

    static *readParameters(view: BufferReader): Generator<Keyframe<AnimatedFloat>> {
        for (let count = view.readUint8(); count > 0; count--)
            yield {
                key: view.readFloat32(),
                value: {
                    easing: view.readUint8(),
                    keyframes: [...AnimatedFloatProperty.readKeyframes(view)],
                },
            }
    }

    read(view: BufferReader): void {
        this.easing = view.readUint8()
        this.keyframes = [...AnimatedFloatProperty.readParameters(view)]
    }

    static writeKeyframes(view: BufferWriter, keyframes: Keyframe<number>[]): void {
        view.writeUint8(keyframes.length)

        for (const { key, value } of keyframes) {
            view.writeFloat32(key)
            view.writeFloat32(value)
        }
    }

    static writeParameters(view: BufferWriter, parameters: Keyframe<AnimatedFloat>[]): void {
        view.writeUint8(parameters.length)

        for (const { key, value: { easing, keyframes } } of parameters) {
            view.writeFloat32(key)
            view.writeUint8(easing)
            this.writeKeyframes(view, keyframes)
        }
    }

    write(view: BufferWriter): void {
        view.writeUint8(this.easing)
        AnimatedFloatProperty.writeParameters(view, this.keyframes)
    }

    toJSON() {
        return {
            easing: this.easing,
            keyframe: this.keyframes,
        }
    }
}
