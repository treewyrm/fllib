import { type QuaternionLike } from './quaternion.js'
import { type VectorLike } from './vector.js'
import * as Quaternion from './quaternion.js'
import * as Vector from './vector.js'

export type TransformLike = { position: VectorLike; orientation: QuaternionLike }

export const BYTES_PER_ELEMENT = Vector.BYTES_PER_ELEMENT + Quaternion.BYTES_PER_ELEMENT

/** Creates identity transform. */
export const identity = (): TransformLike => ({ position: Vector.origin(), orientation: Quaternion.identity() })

/** Tests if value is a transform-like object. */
export const is = (value: unknown): value is TransformLike =>
    value !== null &&
    typeof value === 'object' &&
    'position' in value &&
    'orientation' in value &&
    'scale' in value &&
    Vector.is(value.position) &&
    Quaternion.is(value.orientation) &&
    typeof value.scale === 'number'

/** Creates a copy of transform. */
export const copy = ({ position, orientation }: TransformLike): TransformLike => ({
    position: Vector.copy(position),
    orientation: Quaternion.copy(orientation),
})

/**
 * Transforms vector by a transform object.
 * @param v Input vector
 * @param t Input transform
 * @returns
 */
export const transform = (v: VectorLike, t: TransformLike): VectorLike =>
    Vector.add(Quaternion.transform(v, t.orientation), t.position)

/**
 * Transforms vector by inverse of transform object.
 * @param v Input vector
 * @param t Input transform
 * @returns
 */
export const revert = (v: VectorLike, t: TransformLike): VectorLike =>
    Quaternion.transform(Vector.subtract(v, t.position), Quaternion.conjugate(t.orientation))

/**
 * Multiplies transform by a transform object.
 * @param child Child transform
 * @param parent Parent transform
 * @returns
 */
export const multiply = (child: TransformLike, parent: TransformLike): TransformLike => ({
    position: Vector.add(Quaternion.transform(child.position, parent.orientation), parent.position),
    orientation: Quaternion.multiply(parent.orientation, child.orientation),
})

/**
 * Interpolates between two transforms.
 * @param t Normalized input value.
 * @param a Start transform.
 * @param b End transform.
 * @returns
 */
export const interpolate = (t: number, a: TransformLike, b: TransformLike): TransformLike => ({
    position: Vector.lerp(a.position, b.position, t),
    orientation: Quaternion.slerp(a.orientation, b.orientation, t),
})

/** Converts transformation to Matrix4. */
export const toMatrix4 = ({ position, orientation }: TransformLike, m: Float32Array): void => {
    const x = Quaternion.transform(Vector.axisX(), orientation)
    const y = Quaternion.transform(Vector.axisY(), orientation)
    const z = Quaternion.transform(Vector.axisZ(), orientation)

    m[0] = x.x
    m[1] = x.y
    m[2] = x.z
    m[3] = 0
    m[4] = y.x
    m[5] = y.y
    m[6] = y.z
    m[7] = 0
    m[8] = z.x
    m[9] = z.y
    m[10] = z.z
    m[11] = 0
    m[12] = position.x
    m[13] = position.y
    m[14] = position.z
    m[15] = 1
}

/**
 * Pushes transform to transform stack.
 * @param array Array of transforms
 * @param transform Transform to push
 */
export const push = (array: TransformLike[], transform: TransformLike): void => {
    const last = array.at(-1)
    array.push(last ? multiply(transform, last) : copy(transform))
}