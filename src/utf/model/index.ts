import Compound, { type Model } from './compound.js'
import Part from './part.js'
import Rigid from './rigid.js'
import Animation from './animation/library.js'
import JointMap from './animation/jointmap.js'
import ObjectMap from '../../objectmap.js'
import Channel from './animation/channel.js'
import { type TransformLike } from '../../math/transform.js'
import { Hardpoint } from './types.js'
import { Transform } from '../../math/index.js'
import { Joint } from './constraint.js'

type PartStep<T extends Part> = {
    type: 'part'

    /** Compound child name. */
    name: string

    /** Compound parent name. */
    parent?: string

    /** Compound joint. */
    joint?: Joint

    /** Transformation. */
    transform: TransformLike

    /** Part object. */
    part: T
}

type HardpointStep = {
    type: 'hardpoint'

    /** Hardpoint name. */
    name: string

    /** Compound parent name. */
    parent: string

    /** Transformation. */
    transform: TransformLike

    /** Hardpoint object. */
    hardpoint: Hardpoint
}

/**
 * Lists parts in a model.
 * @param root
 */
export function* listParts<T extends Part>(root: Model<T>) {
    if (!root.isCompound) yield root
    else for (const [child] of root.parts) yield child.part
}

/**
 * Iterate through model part.
 * @param part Parent object
 * @param child Compound child name
 * @param parent Compound parent name
 * @param transforms Transform stack
 */
function* iteratePart<T extends Part>(
    part: T,
    child: string,
    parent?: string,
    joint?: Joint,
    transforms: TransformLike[] = []
): Generator<PartStep<T> | HardpointStep> {
    if (!transforms.length) throw new RangeError('Attempting to iterate through model part with empty transform stack.')

    yield { type: 'part', name: child, parent, joint, transform: transforms.at(-1)!, part }

    for (const [name, hardpoint] of part.hardpoints.objects()) {
        const { position, orientation } = hardpoint

        Transform.push(transforms, { position, orientation })

        // Transform stack will have at least one element after push.
        yield { type: 'hardpoint', name, parent: child, transform: transforms.at(-1)!, hardpoint }

        transforms.pop()
    }
}

/**
 * Iterate through compound object.
 * @param compound Compound object
 * @param parent Compound parent name
 * @param transforms Transform stack
 */
function* iterateCompound<T extends Part>(
    compound: Compound<T>,
    parent?: string,
    transforms: TransformLike[] = []
): Generator<PartStep<T> | HardpointStep> {
    const {
        name,
        part,
        joint,
    } = compound

    Transform.push(transforms, { position: joint.position, orientation: joint.rotation })

    yield* iteratePart(part, name, parent, joint, transforms)

    for (const child of compound) yield* iterateCompound(child, name, transforms)

    transforms.pop()
}

/**
 * Iterate through model with transform stack.
 * @param model Compound or single part model
 * @param transforms Transform stack
 */
export function* iterateModel<T extends Part>(model: Model<T>, transforms: TransformLike[] = [Transform.identity()]) {
    model.isCompound
        ? yield* iterateCompound(model, undefined, transforms)
        : yield* iteratePart(model, '', undefined, undefined, transforms)
}

export { type Model }
export { Fixed, Prismatic, Revolute, Cylinder, Loose, Sphere } from './joint/index.js'
export { Compound, Part, Rigid }
export { Animation, JointMap, ObjectMap, Channel }
