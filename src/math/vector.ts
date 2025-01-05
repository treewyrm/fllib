import * as Scalar from './scalar.js'

export type VectorLike = { x: number; y: number; z: number }

export const BYTES_PER_ELEMENT = 3 * Float32Array.BYTES_PER_ELEMENT

/** Tests if value is a vector-like object. */
export const is = (value: unknown): value is VectorLike =>
    value !== null &&
    typeof value === 'object' &&
    'x' in value &&
    'y' in value &&
    'z' in value &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.z === 'number'

/** Zero vector. */
export const origin = (): VectorLike => ({ x: 0, y: 0, z: 0 })

/** Unit length X axis vector. */
export const axisX = (): VectorLike => ({ x: 1, y: 0, z: 0 })

/** Unit length Y axis vector. */
export const axisY = (): VectorLike => ({ x: 0, y: 1, z: 0 })

/** Unit length Z axis vector. */
export const axisZ = (): VectorLike => ({ x: 0, y: 0, z: 1 })

const { POSITIVE_INFINITY, NEGATIVE_INFINITY } = Number

export const positiveInfinity = (): VectorLike => ({ x: POSITIVE_INFINITY, y: POSITIVE_INFINITY, z: POSITIVE_INFINITY })

export const negativeInfinity = (): VectorLike => ({ x: NEGATIVE_INFINITY, y: NEGATIVE_INFINITY, z: NEGATIVE_INFINITY })

/** Tests if vector has any NaN components. */
export const isNaN = (a: VectorLike): boolean => Number.isNaN(a.x) || Number.isNaN(a.y) || Number.isNaN(a.z)

/** Tests if vector has finite components. */
export const isFinite = (a: VectorLike): boolean => Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.z)

/** Calculates dot (scalar) product of two vectors. */
export const dot = (a: VectorLike, b: VectorLike): number => a.x * b.x + a.y * b.y + a.z * b.z

/** Calculates vector magnitude/length. */
export const magnitude = (a: VectorLike): number => Math.sqrt(dot(a, a))

/** Normalizes vector to unit magnitude/length. */
export const normalize = (a: VectorLike): VectorLike => divideScalar(a, magnitude(a))

/** Calculates angle between two vectors. */
export const angle = (a: VectorLike, b: VectorLike): number => Math.acos(dot(a, b) / (magnitude(a) * magnitude(b)))

/** Calculates distance between two vectors. */
export const distance = (a: VectorLike, b: VectorLike): number => magnitude(subtract(a, b))

/** Tests if two vectors are equal within margin of error. */
export const equal = (a: VectorLike, b: VectorLike, epsilon?: number) =>
    Scalar.equal(a.x, b.x, epsilon) && Scalar.equal(a.y, b.y, epsilon) && Scalar.equal(a.z, b.z, epsilon)

/** Generates random unit vector (uniform distribution). */
export const random = (): VectorLike => {
    const a = Math.acos(Scalar.random(-1, 1))
    const b = Scalar.random(0, 1) * Math.PI * 2

    return {
        x: Math.sin(a) * Math.cos(b),
        y: Math.sin(a) * Math.sin(b),
        z: Math.cos(a),
    }
}

/** Creates a copy of vector components. */
export const copy = ({ x, y, z }: VectorLike): VectorLike => ({ x, y, z })

/** Adds two vectors. */
export const add = (a: VectorLike, b: VectorLike): VectorLike => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
})

/** Adds scalar value to a vector. */
export const addScalar = (a: VectorLike, b: number): VectorLike => ({
    x: a.x + b,
    y: a.y + b,
    z: a.z + b,
})

/** Subtracts vector from a vector. */
export const subtract = (a: VectorLike, b: VectorLike): VectorLike => ({
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
})

/** Subtracts scalar value from a vector. */
export const subtractScalar = (a: VectorLike, b: number): VectorLike => ({
    x: a.x - b,
    y: a.y - b,
    z: a.z - b,
})

/** Multiplies two vectors. */
export const multiply = (a: VectorLike, b: VectorLike): VectorLike => ({
    x: a.x * b.x,
    y: a.y * b.y,
    z: a.z * b.z,
})

/** Multiplies vector by a scalar value. */
export const multiplyScalar = (a: VectorLike, b: number): VectorLike => ({
    x: a.x * b,
    y: a.y * b,
    z: a.z * b,
})

/** Divides vector by a vector. */
export const divide = (a: VectorLike, b: VectorLike): VectorLike => ({
    x: a.x / b.x,
    y: a.y / b.y,
    z: a.z / b.z,
})

/** Divides vector by a scalar value. */
export const divideScalar = (a: VectorLike, b: number): VectorLike => ({
    x: a.x / b,
    y: a.y / b,
    z: a.z / b,
})

/** Calculates cross (vector) product. */
export const cross = (a: VectorLike, b: VectorLike): VectorLike => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
})

/** Calculates reflection vector. */
export const reflect = (a: VectorLike, b: VectorLike): VectorLike => {
    const s = 2 * (dot(a, b) / magnitude(b))

    return {
        x: a.x - b.x * s,
        y: a.y - b.y * s,
        z: a.z - b.z * s,
    }
}

/**
 * Calculates linear interpolation between two vectors.
 * @param t Position
 * @param a Start vector
 * @param b End vector
 * @returns 
 */
export const lerp = (t: number, a: VectorLike, b: VectorLike): VectorLike => ({
    x: Scalar.linear(t, a.x, b.x),
    y: Scalar.linear(t, a.y, b.y),
    z: Scalar.linear(t, a.z, b.z),
})

/**
 * Calculates arc linear interpolation between two vectors.
 * @param a Start vector
 * @param b End vector
 * @param t Position
 * @returns
 */
export const slerp = (a: VectorLike, b: VectorLike, t: number): VectorLike => {
    if (t < 0.01) return lerp(t, a, b)

    a = normalize(a)
    b = normalize(b)

    const k = angle(a, b)
    const s = Math.sin(k)

    const u = Math.sin((1 - t) * k) / s
    const v = Math.sin(t * k) / s

    return {
        x: a.x * u + b.x * v,
        y: a.y * u + b.y * v,
        z: a.z * u + b.z * v,
    }
}

/**
 * Calculates normalized linear interpolation between two vectors.
 * @param a Start vector
 * @param b End vector
 * @param t Position
 * @returns 
 */
export const nlerp = (a: VectorLike, b: VectorLike, t: number): VectorLike =>
    normalize({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
    })

export const min = (a: VectorLike, b: VectorLike): VectorLike => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    z: Math.min(a.z, b.z),
})

export const max = (a: VectorLike, b: VectorLike): VectorLike => ({
    x: Math.max(a.x, b.x),
    y: Math.max(a.y, b.y),
    z: Math.max(a.z, b.z),
})

export const abs = ({ x, y, z }: VectorLike): VectorLike => ({
    x: Math.abs(x),
    y: Math.abs(y),
    z: Math.abs(z),
})

/** Convert to isometric view. */
export const isometric = ({ x, y, z }: VectorLike) => ({
    x: (z - x) / Math.SQRT2,
    y: (x + 2 * y + z) / -Scalar.SQRT6,
})
