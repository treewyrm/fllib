import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Vector } from '../../../math/index.js'
import { readVector, writeVector } from '../../utility.js'
import { Easing, ease } from '../easing.js'
import { type AnimatedProperty } from '../types.js'

type Keyframe<T> = Animation.Keyframe<T>

export type Color = Vector.VectorLike

export interface AnimatedColor {
    easing: Easing
    keyframes: Keyframe<Color>[]
}

/** Animated color property (typically used for relative time, such as over a lifespan of a particle). */
export default class AnimatedColorProperty implements AnimatedProperty<AnimatedColor> {
    /**
     * Evaluate color animation at key.
     * @param animation
     * @param key
     * @returns
     */
    static at({ keyframes, easing }: AnimatedColor, key: number): Color {
        if (!keyframes.length) throw new RangeError('Animated color is missing keyframe data')

        const [start, end, weight] = Animation.at(keyframes, key)
        if (start === end) return start

        return Vector.lerp(start, end, ease(weight, easing))
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
                        value: { x: 0, y: 0, z: 0 },
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

    at(parameter: number, time: number): Color {
        const { keyframes, easing } = this

        if (!keyframes.length) throw new RangeError('Animated color property is missing keyframe data')

        const [start, end, weight] = Animation.at(keyframes, parameter)

        const a = AnimatedColorProperty.at(start, time)
        if (start === end) return a

        const b = AnimatedColorProperty.at(end, time)
        if (a === b) return a

        return Vector.lerp(a, b, ease(weight, easing))
    }

    static *readKeyframes(view: BufferReader): Generator<Keyframe<Color>> {
        for (let count = view.readUint8(); count > 0; count--)
            yield {
                key: view.readFloat32(),
                value: readVector(view),
            }
    }

    static *readParameters(view: BufferReader): Generator<Keyframe<AnimatedColor>> {
        for (let count = view.readUint8(); count > 0; count--)
            yield {
                key: view.readFloat32(),
                value: {
                    easing: view.readUint8(),
                    keyframes: [...AnimatedColorProperty.readKeyframes(view)],
                },
            }
    }

    read(view: BufferReader): void {
        this.easing = view.readUint8()
        this.keyframes = [...AnimatedColorProperty.readParameters(view)]
    }

    static writeKeyframes(view: BufferWriter, keyframes: Keyframe<Color>[]): void {
        view.writeUint8(keyframes.length)

        for (const { key, value } of keyframes) {
            view.writeFloat32(key)
            writeVector(view, value)
        }
    }

    static writeParameters(view: BufferWriter, parameters: Keyframe<AnimatedColor>[]): void {
        view.writeUint8(parameters.length)

        for (const { key, value: { easing, keyframes } } of parameters) {
            view.writeFloat32(key)
            view.writeUint8(easing)
            this.writeKeyframes(view, keyframes)
        }
    }

    write(view: BufferWriter): void {
        view.writeUint8(this.easing)
        AnimatedColorProperty.writeParameters(view, this.keyframes)
    }

    toJSON() {
        return {
            easing: this.easing,
            keyframes: this.keyframes,
        }
    }
}
