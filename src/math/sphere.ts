import { Transform, Vector } from './index.js'
import { type TransformLike } from './transform.js'
import { type VectorLike } from './vector.js'

export type SphereLike = { center: VectorLike; radius: number }

export const BYTES_PER_ELEMENT = Vector.BYTES_PER_ELEMENT + Float32Array.BYTES_PER_ELEMENT

/** Tests if value is a sphere-like object. */
export const is = (value: unknown): value is SphereLike =>
    value !== null &&
    typeof value === 'object' &&
    'center' in value &&
    'radius' in value &&
    Vector.is(value.center) &&
    typeof value.radius === 'number'

export const origin = (): SphereLike => ({ center: Vector.origin(), radius: 0 })

/**
 * Combines two spheres to produce sphere encompassing both.
 * @param a
 * @param b
 * @returns
 */
export const combine = (a: SphereLike, b: SphereLike): SphereLike => {
    const d = Vector.distance(a.center, b.center)

    if (d === 0 && a.radius === b.radius) return { center: Vector.copy(a.center), radius: b.radius }
    if (d + a.radius < b.radius) return { center: Vector.copy(b.center), radius: b.radius }
    if (d + b.radius < a.radius) return { center: Vector.copy(a.center), radius: a.radius }

    const radius = (a.radius + b.radius + d) * 0.5

    return {
        radius,
        center: Vector.add(
            a.center,
            Vector.divideScalar(Vector.multiplyScalar(Vector.subtract(b.center, a.center), radius - a.radius), d)
        ),
    }
}

export const fromPoints = (points: Iterable<VectorLike>): SphereLike => {
    let max = 0
    let center = Vector.origin()
    let radius = 0

    for (const a of points)
        for (const b of points) {
            const distance = Vector.distance(a, b)

            if (distance > max) {
                max = distance

                center = Vector.add(a, Vector.multiplyScalar(Vector.subtract(b, a), 0.25))
                radius = distance * 0.5
            }
        }

    for (const point of points) {
        const distance = Vector.distance(center, point)

        if (distance > radius) {
            radius = (radius + distance) * 0.5
            center = Vector.add(
                center,
                Vector.multiplyScalar(Vector.subtract(point, center), (distance - radius) / distance)
            )
        }
    }

    return { center, radius }
}

export const transform = ({ center, radius }: SphereLike, transform: TransformLike): SphereLike => ({
    center: Transform.transform(center, transform),
    radius,
})
