import { type MatrixLike } from './matrix.js'
import { type VectorLike } from './vector.js'
import * as Vector from './vector.js'
import * as Scalar from './scalar.js'

export type QuaternionLike = { x: number; y: number; z: number; w: number }

export const BYTES_PER_ELEMENT = 4 * Float32Array.BYTES_PER_ELEMENT

/** Tests if value is a quaternion-like object. */
export const is = (value: unknown): value is QuaternionLike =>
    value !== null &&
    typeof value === 'object' &&
    'x' in value &&
    'y' in value &&
    'z' in value &&
    'w' in value &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.z === 'number' &&
    typeof value.w === 'number'

/** Creates identity quaternion. */
export const identity = (): QuaternionLike => ({ x: 0, y: 0, z: 0, w: 1 })

export const equal = (a: QuaternionLike, b: QuaternionLike, epsilon?: number) =>
    Scalar.equal(a.x, b.x, epsilon) &&
    Scalar.equal(a.y, b.y, epsilon) &&
    Scalar.equal(a.z, b.z, epsilon) &&
    Scalar.equal(a.w, b.w, epsilon)

/** Creates a copy of quaternion components. */
export const copy = ({ x, y, z, w }: QuaternionLike): QuaternionLike => ({ x, y, z, w })

/** Calculates dot (scalar) product between two quaternions. */
export const dot = (a: QuaternionLike, b: QuaternionLike): number => a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w

/** Calculates quaternion magnitude/length. */
export const magnitude = (q: QuaternionLike): number => Math.sqrt(dot(q, q))

/** Normalizes quaternion to unit magnitude/length. */
export const normalize = (q: QuaternionLike): QuaternionLike => divideScalar(q, magnitude(q))

export const conjugate = (q: QuaternionLike): QuaternionLike => ({
    x: -q.x,
    y: -q.y,
    z: -q.z,
    w: q.w,
})

export const add = (a: QuaternionLike, b: QuaternionLike): QuaternionLike => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
    w: a.w + b.w,
})

export const subtract = (a: QuaternionLike, b: QuaternionLike): QuaternionLike => ({
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
    w: a.w - b.w,
})

/** Multiplies two quaternions. */
export const multiply = (a: QuaternionLike, b: QuaternionLike): QuaternionLike => {
    const { x: ax, y: ay, z: az, w: aw } = a
    const { x: bx, y: by, z: bz, w: bw } = b

    return {
        x: ax * bw + aw * bx + ay * bz - az * by,
        y: ay * bw + aw * by + az * bx - ax * bz,
        z: az * bw + aw * bz + ax * by - ay * bx,
        w: aw * bw - ax * bx - ay * by - az * bz,
    }
}

/** Multiplies quaternion by a scalar value. */
export const multipyScalar = (a: QuaternionLike, b: number): QuaternionLike => ({
    x: a.x * b,
    y: a.y * b,
    z: a.z * b,
    w: a.w * b,
})

/** Divides quaternion by a scalar value. */
export const divideScalar = (a: QuaternionLike, b: number): QuaternionLike => ({
    x: a.x / b,
    y: a.y / b,
    z: a.z / b,
    w: a.w / b,
})

/** Generates quaternion from axis and angle. */
export const axisAngle = (v: VectorLike, angle: number): QuaternionLike => {
    angle *= 0.5
    const s = Math.sin(angle)

    return {
        x: v.x * s,
        y: v.y * s,
        z: v.z * s,
        w: Math.cos(angle),
    }
}

/** Calculate rotation axis and angle from quaternion.  */
export const getAxisAngle = (q: QuaternionLike, epsilon = 0.0001): [axis: VectorLike, angle: number] => {
    const r = Math.acos(q.w) * 2.0
    const s = Math.sin(r / 2.0)

    if (s > epsilon)
        return [
            {
                x: q.x / s,
                y: q.y / s,
                z: q.z / s,
            },
            r,
        ]

    return [{ ...Vector.axisX() }, r]
}

/** Generates quaternion from pitch/yaw/roll. */
export const pitchYawRoll = ({ x, y, z }: VectorLike): QuaternionLike => {
    x *= 0.5
    y *= 0.5
    z *= 0.5

    const sx = Math.sin(x)
    const cx = Math.cos(x)
    const sy = Math.sin(y)
    const cy = Math.cos(y)
    const sz = Math.sin(z)
    const cz = Math.cos(z)

    return {
        x: sx * cy * cz - cx * sy * sz,
        y: cx * sy * cz + sx * cy * sz,
        z: cx * cy * sz - sx * sy * cz,
        w: cx * cy * cz + sx * sy * sz,
    }
}

/** Calculates W from other components. */
export const rebuildW = (v: VectorLike): number => {
    const s = Vector.dot(v, v)
    return s < 1 ? Math.sqrt(1 - s) : 0
}

/** Generates quaternion from half-angle vector. */
export const halfAngle = (v: VectorLike): QuaternionLike => {
    const k = Math.sqrt(2 - Vector.dot(v, v))

    return {
        x: v.x * k,
        y: v.y * k,
        z: v.z * k,
        w: 1 - k,
    }
}

/** Generates quaternion from half-angle (harmonic mean) vector. */
export const harmonicMean = (v: VectorLike): QuaternionLike => {
    const l = Vector.magnitude(v)
    const t = Math.sin(Math.PI * l * 0.5)
    const h = t / l

    return {
        x: v.x * h,
        y: v.y * h,
        z: v.z * h,
        w: Math.sqrt(1 - t * t),
    }
}

/**
 * Calculates look rotation for given direction, object front axis and world up axis.
 * @param direction Unit vector for direction
 * @param front Unit vector for object front axis
 * @param up Unit vector for world up axis
 * @returns
 */
export const lookRotation = (
    direction: VectorLike,
    front: VectorLike = Vector.axisZ(),
    up: VectorLike = Vector.axisY()
): QuaternionLike => {
    direction = Vector.normalize(direction)
    front = Vector.normalize(front)
    up = Vector.normalize(up)

    let axis = Vector.cross(front, direction)

    if (Vector.dot(axis, axis) === 0) axis = up

    const d = Vector.dot(front, direction)
    const angle = Math.acos(d)

    return axisAngle(axis, angle)
}

/**
 * Generates quaternion from a matrix.
 * @param m Input matrix
 * @returns
 */
export const fromMatrix = ({ x, y, z }: MatrixLike): QuaternionLike => {
    const t = x.x + y.y + z.z
    let s = 0

    if (t > 0) {
        s = 0.5 / Math.sqrt(t + 1.0)

        return {
            x: (z.y - y.z) * s,
            y: (x.z - z.x) * s,
            z: (y.x - x.y) * s,
            w: 0.25 / s,
        }
    }

    if (x.x > y.y && x.x > z.z) {
        s = 2.0 * Math.sqrt(1.0 + x.x - y.y - z.z)

        return {
            x: 0.25 * s,
            y: (x.y + y.x) / s,
            z: (x.z + z.x) / s,
            w: (z.y - y.z) / s,
        }
    }

    if (y.y > z.z) {
        s = 2.0 * Math.sqrt(1.0 + y.y - x.x - z.z)

        return {
            x: (x.y + y.x) / s,
            y: 0.25 * s,
            z: (y.z + z.y) / s,
            w: (x.z - z.x) / s,
        }
    }

    s = 2.0 * Math.sqrt(1.0 + z.z - x.x - y.y)

    return {
        x: (x.z + z.x) / s,
        y: (y.z + z.y) / s,
        z: 0.25 * s,
        w: (y.x - x.y) / s,
    }
}

/**
 * Transforms vector by quaternion.
 * @param v Input vector
 * @param q Input quaternion
 * @returns
 */
export const transform = (v: VectorLike, q: QuaternionLike): VectorLike => {
    const u = Vector.cross(q, v)
    return Vector.add(v, Vector.add(Vector.multiplyScalar(u, 2 * q.w), Vector.multiplyScalar(Vector.cross(q, u), 2)))
}

/**
 * Spherical interpolation.
 * Same as in glmatrix library.
 * @param t Input value
 * @param a Start quaternion
 * @param b End quaternion
 * @param epsilon Narrow distance to switch to linear interpolation
 * @returns
 */
export const slerp = (a: QuaternionLike, b: QuaternionLike, t: number, epsilon = 0.0001): QuaternionLike => {
    let d = dot(a, b)

    if (d < 0) {
        d = -d
        b = multipyScalar(b, -1)
    }

    let u = 1.0 - t
    let v = t

    if (1.0 - d > epsilon) {
        const o = Math.acos(d)
        const s = Math.sin(o)

        u = Math.sin((1.0 - t) * o) / s
        v = Math.sin(t * o) / s
    }

    return {
        x: u * a.x + v * b.x,
        y: u * a.y + v * b.y,
        z: u * a.z + v * b.z,
        w: u * a.w + v * b.w,
    }
}
