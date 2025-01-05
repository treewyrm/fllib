import { QuaternionLike } from '../../math/quaternion.js'
import { VectorLike } from '../../math/vector.js'

/** Attachment hardpoint. */
export interface Hardpoint {
    position: VectorLike
    orientation: QuaternionLike
}

/** Compound joint. */
export interface Joint {
    position: VectorLike
    rotation: QuaternionLike
}