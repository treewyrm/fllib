import { at, range, atEquidistantKeyframes, type Keyframe } from '../../../math/animation.js'
import { Quaternion, Scalar, Vector } from '../../../math/index.js'
import { type QuaternionLike } from '../../../math/quaternion.js'
import { type VectorLike } from '../../../math/vector.js'
import {
    type ReadableDirectory,
    type ReadsDirectory,
    type WritableDirectory,
    type WritesDirectory,
} from '../../types.js'
import { readHalfAngle, readHarmonicMean, writeHalfAngle, writeHarmonicMean } from './utility.js'

export enum ChannelType {
    None = 0,
    Single = 1,
    Vector = 1 << 1,
    Quaternion = 1 << 2,
    UnknownMatrix = 1 << 3, // May be matrix?
    Unknown0 = 1 << 4, // Used in trent and juni face animations, appears in Head01 -> Head joint.
    Unknown1 = 1 << 5, // Used in trent and juni face animations, appears in Head -> Root joint, affects BLP/TLP joint maps, lipsync stuff?
    HalfAngle = 1 << 6,
    HarmonicMean = 1 << 7,
}

type ChannelKeyframeValue = {
    single?: number
    position?: VectorLike
    rotation?: QuaternionLike
}

type ChannelKeyframe = Keyframe<ChannelKeyframeValue>

export default class Channel implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'
    readonly filename = 'Channel'

    /** Keyframe data type. */
    type: ChannelType = 0

    /** Time interval. */
    interval = -1

    keyframes: ChannelKeyframe[] = []

    get byteLength(): number {
        return 12 + 0 // Header + Frames
    }

    /** Calculates starting and ending keys. */
    get range(): [start: number, end: number] {
        return this.interval < 0 ? range(this.keyframes) : [0, this.interval]
    }

    /** Calculates frame rate when interval is specified, otherwise returns undefined. */
    get frameRate(): number | undefined {
        return this.interval < 0 ? undefined : this.interval / this.keyframes.length
    }

    get frameByteLength(): number {
        return Float32Array.BYTES_PER_ELEMENT // Key
    }

    getValuesAt(key: number) {
        return this.interval < 0 ? at(this.keyframes, key) : atEquidistantKeyframes(this.keyframes, key / this.interval)
    }

    at(key: number): ChannelKeyframeValue {
        const { range: [from, to] } = this

        // Remap key to channel range.
        // TODO: Rework remap for to support THN compound animation control.
        key = Scalar.remap(Scalar.repeat(Scalar.remap(key, from, to, 0, 1)), 0, 1, from, to)

        const [start, end, weight] = this.getValuesAt(key)
        
        const single = this.type & ChannelType.Single ? Scalar.linear(start.single!, end.single!, weight) : undefined
        const position = this.type & ChannelType.Vector ? Vector.lerp(start.position!, end.position!, weight) : undefined
        const rotation = this.type & ChannelType.Quaternion ? Quaternion.slerp(start.rotation!, end.rotation!, weight) : undefined

        return {
            single,
            position,
            rotation,
        }
    }

    read(parent: ReadableDirectory): void {
        const header = parent.getFile('Header')
        if (!header) throw new Error('Animation channel is missing header file.')

        let { view } = header

        const count = view.readInt32()
        if (count <= 0) throw new RangeError('Animation channel contains zero frames.')

        this.interval = view.readFloat32()
        this.type = view.readInt32()

        const frames = parent.getFile('Frames')
        if (!frames) throw new Error('Animation channel is missing frames file.')
        ;({ view } = frames)

        const step = this.interval >= 0 ? this.interval / count : 0

        for (let i = 0; i < count; i++) {
            const key = this.interval < 0 ? view.readFloat32() : step * i
            const value: ChannelKeyframeValue = {}

            if (this.type & ChannelType.Single) value.single = view.readFloat32()

            if (this.type & ChannelType.Vector)
                value.position = {
                    x: view.readFloat32(),
                    y: view.readFloat32(),
                    z: view.readFloat32(),
                }

            if (this.type & ChannelType.Quaternion)
                value.rotation = {
                    w: view.readFloat32(),
                    x: view.readFloat32(),
                    y: view.readFloat32(),
                    z: view.readFloat32(),
                }

            if (this.type & ChannelType.HalfAngle) value.rotation = readHalfAngle(view)
            if (this.type & ChannelType.HarmonicMean) value.rotation = readHarmonicMean(view)

            this.keyframes[i] = { key, value }
        }
    }

    write(parent: WritableDirectory): void {
        const header = parent.setFile('Header')
        header.byteLength = 2 * Uint32Array.BYTES_PER_ELEMENT + Float32Array.BYTES_PER_ELEMENT

        let view = header.view

        view.writeInt32(this.keyframes.length)
        view.writeFloat32(this.interval)
        view.writeInt32(this.type)

        const frames = parent.setFile('Frames')
        frames.byteLength = this.keyframes.length * this.frameByteLength

        view = frames.view

        for (const {
            key,
            value: { single: float = 0, position = Vector.origin(), rotation = Quaternion.identity() },
        } of this.keyframes) {
            if (this.interval < 0) view.writeFloat32(key)

            if (this.type & ChannelType.Single) view.writeFloat32(float)
            if (this.type & ChannelType.Vector) {
                view.writeFloat32(position.x)
                view.writeFloat32(position.y)
                view.writeFloat32(position.z)
            }

            if (this.type & ChannelType.Quaternion) {
                view.writeFloat32(rotation.w)
                view.writeFloat32(rotation.x)
                view.writeFloat32(rotation.y)
                view.writeFloat32(rotation.z)
            }

            if (this.type & ChannelType.HalfAngle) writeHalfAngle(view, rotation)
            if (this.type & ChannelType.HarmonicMean) writeHarmonicMean(view, rotation)
        }
    }
}
