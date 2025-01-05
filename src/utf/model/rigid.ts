import Compound from './compound.js'
import Part from './part.js'
import { MultiLevel, VMeshLibrary, VMeshPart, VMeshWire } from '../vmesh/index.js'
import { ReadsDirectory, WritesDirectory, type ReadableDirectory, type WritableDirectory } from '../types.js'
import { iterateModel, listParts, type Model } from './index.js'
import { Box, Sphere, Vector } from '../../math/index.js'
import { type SphereLike } from '../../math/sphere.js'
import { type BoxLike } from '../../math/box.js'
import { VectorLike } from '../../math/vector.js'

export default class Rigid extends Part implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'

    get [Symbol.toStringTag]() {
        return 'RigidPart'
    }

    /** Level of details */
    part?: MultiLevel | VMeshPart

    /** HUD wireframe display. */
    wireframe?: VMeshWire

    /** Reserved for collision detection hulls from Surfaces. */
    hulls?: unknown

    /** LOD ranges. */
    get ranges(): number[] {
        return this.part instanceof MultiLevel ? this.part.ranges : [0, Infinity]
    }

    /** LOD parts. */
    get levels(): VMeshPart[] {
        return this.part instanceof MultiLevel ? this.part.levels : this.part ? [this.part] : []
    }

    /** Boundary sphere encompassing all LODs. */
    get boundarySphere(): SphereLike {
        let bounary = Sphere.origin()

        for (const {
            reference: { boundingSphere },
        } of this.levels)
            bounary = Sphere.combine(bounary, boundingSphere)

        return bounary
    }

    /** Boundary box encompassing all LODs. */
    get boundaryBox(): BoxLike {
        let boundary = Box.empty()

        for (const {
            reference: {
                boundingBox: { minimum, maximum },
            },
        } of this.levels) {
            boundary.minimum = Vector.min(boundary.minimum, minimum)
            boundary.maximum = Vector.max(boundary.maximum, maximum)
        }

        return boundary
    }

    /**
     * Returns unique mesh ids used by all levels and wireframe.
     * @returns
     */
    getMeshIds(): number[] {
        return [
            ...[this.wireframe, ...this.levels]
                .filter((value) => value !== undefined)
                .reduce(
                    (meshIds, item) => (
                        meshIds.add(item instanceof VMeshPart ? item.reference.meshId : item.data.meshId), meshIds
                    ),
                    new Set<number>()
                ),
        ]
    }

    /**
     * Returns unique material ids used by all levels.
     * @param library Mesh buffer library
     * @returns
     */
    getMaterialIds(...libraries: VMeshLibrary[]): number[] {
        return [
            ...this.levels.reduce(
                (materialIds, { reference: { meshId } }) => (
                    libraries.forEach((library) =>
                        library.get(meshId)?.data.groups.forEach(({ materialId }) => materialIds.add(materialId))
                    ),
                    materialIds
                ),
                new Set<number>()
            ),
        ]
    }

    /**
     * Returns mesh part for range.
     * @param range
     * @returns
     */
    atRange(range: number): VMeshPart | undefined {
        return this.part instanceof MultiLevel ? this.part.atRange(range) : this.part
    }

    read(parent: ReadableDirectory): void {
        super.read(parent)

        this.part = parent.read(new MultiLevel()) ?? parent.read(new VMeshPart())
        this.wireframe = parent.read(new VMeshWire())
    }

    write(parent: WritableDirectory): void {
        super.write(parent)

        if (this.part) parent.write(this.part)
        if (this.wireframe) parent.write(this.wireframe)
    }

    /**
     * Loads (unserializes) rigid model from a directory.
     * @param root
     * @returns
     */
    static load(root: ReadableDirectory): Model<Rigid> {
        return Compound.from(root, (directory) => {
            const part = new this()
            part.read(directory)
            return part
        })
    }

    /**
     * Returns unique mesh ids used by rigid parts in a model.
     * @param model
     * @returns
     */
    static getMeshIds(model: Model<Part>): number[] {
        const meshIds = new Set<number>()

        for (const part of listParts(model))
            if (part instanceof Rigid) part.getMeshIds().forEach((meshId) => meshIds.add(meshId))

        return [...meshIds]
    }

    /**
     * Returns unique material ids used by rigid parts in a model.
     * @param model
     * @param libraries
     * @returns
     */
    static getMaterialIds(model: Model<Part>, ...libraries: VMeshLibrary[]): number[] {
        const materialIds = new Set<number>()

        for (const part of listParts(model))
            if (part instanceof Rigid)
                part.getMaterialIds(...libraries).forEach((materialId) => materialIds.add(materialId))

        return [...materialIds]
    }

    /**
     * Calculates boundary box for entire model.
     * @param model
     * @returns
     */
    static getBoundaryBox(model: Model<Part>): BoxLike {
        const points: VectorLike[] = []

        for (const step of iterateModel(model))
            if (step.type == 'part' && step.part instanceof Rigid)
                points.push(...Box.points(Box.transform(step.part.boundaryBox, step.transform)))

        return Box.fromPoints(points)
    }

    /**
     * Calcualtes boundary sphere for entire model.
     * @param model
     * @returns
     */
    static getBoundarySphere(model: Model<Part>): SphereLike {
        let sphere = Sphere.origin()

        for (const step of iterateModel(model))
            if (step.type === 'part' && step.part instanceof Rigid)
                sphere = Sphere.combine(sphere, Sphere.transform(step.part.boundarySphere, step.transform))

        return sphere
    }
}
