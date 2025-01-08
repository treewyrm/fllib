import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Animation, Scalar, Vector } from '../../../math/index.js'
import { readVector } from '../../utility.js'
import { Easing, ease } from '../easing.js'
import { type AnimatedProperty } from '../types.js'

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
    static at({ keyframes, easing }: AnimatedColor, key: number): Vector.VectorLike {
        if (!keyframes.length) throw new RangeError('Animated color is missing keyframe data')

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

    at(parameter: number, time: number): Vector.VectorLike {
        const { keyframes, easing } = this

        if (!keyframes.length) throw new RangeError('Animated color property is missing keyframe data')

        const [start, end, weight] = Animation.at(keyframes, parameter)

        const a = AnimatedColorProperty.at(start, time)
        if (start === end) return a

        const b = AnimatedColorProperty.at(end, time)
        if (a === b) return a

        return Vector.lerp(a, b, ease(weight, easing))
    }

    static *readKeyframes(view: BufferReader) {
        for (let count = view.readUint8(); count > 0; count--)
            yield {
                key: view.readFloat32(),
                value: readVector(view),
            }
    }

    static *readParameters(view: BufferReader) {
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

    write(view: BufferWriter): void {
        const { keyframes: parameters, easing } = this

        view.writeUint8(easing)
        view.writeUint8(parameters.length)

        for (const {
            key,
            value: { easing, keyframes },
        } of parameters) {
            view.writeFloat32(key)
            view.writeUint8(easing)
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
