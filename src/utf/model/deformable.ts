import { type WritableDirectory, type WritesDirectory, type ReadableDirectory, type ReadsDirectory } from '../types.js'
import Compound from './compound.js'
import Loose from './joint/loose.js'
import Bone from './deformable/bone.js'
import Mesh from './deformable/mesh.js'

/**
 * Deformable (skeleton) compound model. Used only for cutscene characters.
 */
export default class Deformable implements ReadsDirectory, WritesDirectory {
    filename?: string | undefined
    readonly kind = 'directory'

    /** LOD meshes. */
    meshes: Mesh[] = []

    /** Mesh LOD fractions. */
    fractions: number[] = []

    /** Skeleton root. */
    root = new Compound(new Bone(), new Loose())

    read(parent: ReadableDirectory): void {
        const multiLevel = parent.getDirectory('MultiLevel')
        if (!multiLevel) throw new Error('Deformable model is missing MultiLevel')

        const fractions = multiLevel.getFile('Fractions')
        if (!fractions) throw new Error('Deformable model is missing Fractions in MultiLevel')

        this.fractions.length = this.meshes.length = 0

        for (const fraction of fractions.readFloats()) {
            this.fractions.push(fraction)

            const mesh = multiLevel.read(new Mesh(), `Mesh${this.meshes.length}`)
            if (!mesh) throw new RangeError(`Deformable model is missing mesh ${this.meshes.length}`)

            this.meshes.push(mesh)
        }

        // Read root compound.
        // Deformable models are always compound and do not have single-part mode like rigid models do.
        const root = Compound.from(parent, (directory) => {
            const bone = new Bone()
            bone.read(directory)
            return bone
        })

        if (!root) throw new Error('Deformable model is missing Root bone')
        this.root = root
    }

    write(parent: WritableDirectory): void {
        const multiLevel = parent.setDirectory('MultiLevel')

        multiLevel.setFile('Fractions').writeFloats(...this.fractions)

        for (const [index, mesh] of this.meshes.entries()) multiLevel.write(mesh, `Mesh${index}`)

        this.root.write(parent)
    }
}
