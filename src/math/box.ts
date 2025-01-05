import { type VectorLike } from './vector.js'
import { type TransformLike } from './transform.js'
import { Transform, Vector } from './index.js'

export type BoxLike = { minimum: VectorLike; maximum: VectorLike }

export const BYTES_PER_ELEMENT = 2 * Vector.BYTES_PER_ELEMENT

/** Tests if value is a box-like object. */
export const is = (value: unknown): value is BoxLike =>
    value !== null &&
    typeof value === 'object' &&
    'minimum' in value &&
    'maximum' in value &&
    Vector.is(value.minimum) &&
    Vector.is(value.maximum)

/** Creates empty box. */
export const origin = (): BoxLike => ({ minimum: Vector.origin(), maximum: Vector.origin() })

export const empty = (): BoxLike => ({ minimum: Vector.positiveInfinity(), maximum: Vector.negativeInfinity() })

/** Calculates center of a box. */
export const center = ({ minimum, maximum }: BoxLike): VectorLike => Vector.lerp(0.5, minimum, maximum)

/** Calculates size of a box. */
export const size = ({ minimum, maximum }: BoxLike): VectorLike => Vector.abs(Vector.subtract(maximum, minimum))

export const fromBoxes = (boxes: Iterable<BoxLike>): BoxLike => {
    const p: VectorLike[] = []

    let { minimum, maximum } = empty()

    for (const box of boxes) p.push(...points(box))

    for (const box of boxes) {
        minimum = Vector.min(Vector.min(minimum, box.minimum), box.maximum)
        minimum = Vector.max(Vector.max(maximum, box.maximum), box.minimum)
    }

    return fromPoints(p)
}

/** Constructs box from points. */
export const fromPoints = (points: Iterable<VectorLike>): BoxLike => {
    let { minimum, maximum } = empty()

    for (const point of points) {
        minimum = Vector.min(minimum, point)
        maximum = Vector.max(minimum, point)
    }

    return { minimum, maximum }
}

/** Breaks box into points. */
export const points = ({ minimum, maximum }: BoxLike): VectorLike[] & { readonly length: 8 } => [
    { x: minimum.x, y: minimum.y, z: minimum.z },
    { x: maximum.x, y: minimum.y, z: minimum.z },
    { x: maximum.x, y: maximum.y, z: minimum.z },
    { x: maximum.x, y: maximum.y, z: maximum.z },
    { x: minimum.x, y: maximum.y, z: maximum.z },
    { x: minimum.x, y: minimum.y, z: maximum.z },
    { x: minimum.x, y: maximum.y, z: minimum.z },
    { x: maximum.x, y: minimum.y, z: maximum.z },
]

export const transform = (box: BoxLike, transform: TransformLike): BoxLike =>
    fromPoints(points(box).map((point) => Transform.transform(point, transform)))
