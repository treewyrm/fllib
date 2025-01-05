import { Vector } from './index.js';
import { QuaternionLike } from './quaternion.js'
import { type VectorLike } from './vector.js'

export type MatrixLike = { x: VectorLike; y: VectorLike; z: VectorLike }

export const BYTES_PER_ELEMENT = 3 * Vector.BYTES_PER_ELEMENT

/** Tests if value is a matrix-like object. */
export const is = (value: unknown): value is MatrixLike =>
    value !== null &&
    typeof value === 'object' &&
    'x' in value &&
    'y' in value &&
    'z' in value &&
    Vector.is(value.x) &&
    Vector.is(value.y) &&
    Vector.is(value.z)

/** Creates identity matrix. */
export const identity = (): MatrixLike => ({ x: Vector.axisX(), y: Vector.axisY(), z: Vector.axisZ() })

export const equal = (a: MatrixLike, b: MatrixLike, epsilon?: number) =>
    Vector.equal(a.x, b.x, epsilon) && Vector.equal(a.y, b.y, epsilon) && Vector.equal(a.z, b.z, epsilon)

/** Creates a copy of matrix components. */
export const copy = ({ x, y, z }: MatrixLike): MatrixLike => ({
    x: Vector.copy(x),
    y: Vector.copy(y),
    z: Vector.copy(z),
})

/** Calculates matrix determinant (1 for normal and -1 for flipped matrices). */
export const determinant = ({ x, y, z }: MatrixLike) =>
    x.x * (y.y * z.z - y.z * z.y) - x.y * (y.x * z.z - y.z * z.x) + x.z * (y.x * z.y - y.y * z.x)

/** Normalizes matrix vector components. */
export const normalize = (m: MatrixLike): MatrixLike => ({
    x: Vector.normalize(m.x),
    y: Vector.normalize(m.y),
    z: Vector.normalize(m.z),
})

/** Transposes marix rows to columns. */
export const transpose = (m: MatrixLike): MatrixLike => {
    const { x, y, z } = m

    return {
        x: {
            x: x.x,
            y: y.x,
            z: z.x,
        },
        y: {
            x: x.y,
            y: y.y,
            z: z.y,
        },
        z: {
            x: x.z,
            y: y.z,
            z: z.z,
        },
    }
}

/** Calculates inversion of a matrix. */
export const invert = (m: MatrixLike): MatrixLike => {
    const d = 1 / determinant(m)
    if (d === Infinity) throw new Error()

    const { x, y, z } = m

    return {
        x: {
            x: (z.z * y.y - y.z * z.y) * d,
            y: (-z.z * x.y + x.z * z.y) * d,
            z: (y.z * x.y - x.z * y.y) * d,
        },
        y: {
            x: (-z.z * y.x + y.z * z.x) * d,
            y: (z.z * x.x - x.z * z.x) * d,
            z: (-y.z * x.x + x.z * y.x) * d,
        },
        z: {
            x: (z.y * y.x - y.y * z.x) * d,
            y: (-z.y * x.x + x.y * z.x) * d,
            z: (y.y * x.x - x.y * y.x) * d,
        },
    }
}

/** Multiplies two matrices. */
export const multiply = (a: MatrixLike, b: MatrixLike): MatrixLike => {
    const { x: ax, y: ay, z: az } = a
    const { x: bx, y: by, z: bz } = b

    return {
        x: {
            x: ax.x * bx.x + ay.x * bx.y + az.x * bx.z,
            y: ax.y * bx.x + ay.y * bx.y + az.y * bx.z,
            z: ax.z * bx.x + ay.z * bx.y + az.z * bx.z,
        },
        y: {
            x: ax.x * by.x + ay.x * by.y + az.x * by.z,
            y: ax.y * by.x + ay.y * by.y + az.y * by.z,
            z: ax.z * by.x + ay.z * by.y + az.z * by.z,
        },
        z: {
            x: ax.x * bz.x + ay.x * bz.y + az.x * bz.z,
            y: ax.y * bz.x + ay.y * bz.y + az.y * bz.z,
            z: ax.z * bz.x + ay.z * bz.y + az.z * bz.z,
        },
    }
}

/** Transforms vector by a matrix. */
export const transform = (v: VectorLike, m: MatrixLike): VectorLike => {
    const { x: ax, y: ay, z: az } = v
    const { x: bx, y: by, z: bz } = m

    return {
        x: ax * bx.x + ay * by.x + az * bz.x,
        y: ax * bx.y + ay * by.y + az * bz.y,
        z: ax * bx.z + ay * by.z + az * bz.z,
    }
}

/** Transforms vector by a transposed matrix. */
export const transformTransposed = (v: VectorLike, m: MatrixLike): VectorLike => {
    const { x: ax, y: ay, z: az } = v
    const { x: bx, y: by, z: bz } = m

    return {
        x: ax * bx.x + ay * bx.y + az * bx.z,
        y: ax * by.x + ay * by.y + az * by.z,
        z: ax * bz.x + ay * bz.y + az * bz.z,
    }
}

/** Calculates matrix by axis and angle. */
export const axisAngle = (v: VectorLike, angle: number): MatrixLike => {
    const { x, y, z } = v

    const co = Math.cos(angle)
    const si = Math.sin(angle)
    const t = 1 - co

    const xy = x * y * t
    const zs = z * si
    const xz = x * z * t
    const ys = y * si
    const yz = y * z * t
    const xs = x * si

    return {
        x: {
            x: co + x * x * t,
            y: xy - zs,
            z: xz + ys,
        },
        y: {
            x: xy + zs,
            y: co + y * y * t,
            z: yz - xs,
        },
        z: {
            x: xz - ys,
            y: yz + xs,
            z: co + z * z * t,
        },
    }
}

export const fromQuaternion = (q: QuaternionLike): MatrixLike => {
    const { x, y, z, w } = q
    const xx = x * x
    const xy = x * y
    const xz = x * z
    const xw = x * w
    const yy = y * y
    const yz = y * z
    const yw = y * w
    const zz = z * z
    const zw = z * w

    return {
        x: {
            x: 1 - 2 * (yy + zz),
            y: 2 * (xy - zw),
            z: 2 * (xz + yw),
        },
        y: {
            x: 2 * (xy + zw),
            y: 1 - 2 * (xx + zz),
            z: 2 * (yz - xw),
        },
        z: {
            x: 2 * (xz - yw),
            y: 2 * (yz + xw),
            z: 1 - 2 * (xx + yy),
        },
    }
}

/**
 *
 * @param direction
 * @param up
 * @returns
 */
export const lookAt = (direction: VectorLike, up: VectorLike = Vector.axisY()): MatrixLike | undefined => {
    const x = Vector.normalize(direction)
    const y = Vector.cross(Vector.normalize(up), direction)
    const z = Vector.cross(direction, y)

    return { x, y, z }
}
