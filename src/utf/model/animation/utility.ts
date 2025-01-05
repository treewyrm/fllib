import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { Quaternion, Vector } from '../../../math/index.js'
import { type QuaternionLike } from '../../../math/quaternion.js'

export const readHalfAngle = (view: BufferReader): QuaternionLike => {
    const vector = Vector.divideScalar(
        {
            x: view.readInt16(),
            y: view.readInt16(),
            z: view.readInt16(),
        },
        0x7fff
    )

    const d = Vector.dot(vector, vector)
    const w = d < 1 ? Math.sqrt(1 - d) : 0

    return { ...vector, w }
}

export const writeHalfAngle = (view: BufferWriter, q: QuaternionLike): void => {
    const vector = Vector.multiplyScalar(q, 1 / Math.sqrt(1 + q.w))

    view.writeInt16(vector.x * 0x7fff)
    view.writeInt16(vector.y * 0x7fff)
    view.writeInt16(vector.z * 0x7fff)
}

export const readHarmonicMean = (view: BufferReader): QuaternionLike => {
    const vector = Vector.divideScalar(
        {
            x: view.readInt16(),
            y: view.readInt16(),
            z: view.readInt16(),
        },
        0x7fff
    )

    let w = 1

    if (Vector.dot(vector, vector) > 0) {
        const l = Vector.magnitude(vector)
        const t = Math.sin(Math.PI * l * 0.5)
        const k = t / l

        vector.x *= k
        vector.y *= k
        vector.z *= k
        w = Math.sqrt(1 - t * t)
    }

    return { ...vector, w }
}

export const writeHarmonicMean = (view: BufferWriter, q: QuaternionLike): void => {
    if (q.w < 0) q = Quaternion.multipyScalar(q, -1)

    const vector = Vector.multiplyScalar(q, (Math.SQRT2 + 1) / (1 + q.w + Math.sqrt(2 + 2 * q.w)))

    view.writeInt16(vector.x * 0x7fff)
    view.writeInt16(vector.y * 0x7fff)
    view.writeInt16(vector.z * 0x7fff)
}
