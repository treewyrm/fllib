import { type WritableDirectory, type WritesDirectory, type ReadableDirectory, type ReadsDirectory } from '../../types.js'
import Compound from '../compound.js'
import Bone from './bone.js'
import Mesh from './mesh.js'

export default class Deformable implements ReadsDirectory, WritesDirectory {
    filename?: string | undefined
    readonly kind = 'directory'

    /** LOD meshes. */
    meshes: Mesh[] = []

    /** Mesh LOD fractions. */
    fractions: number[] = []

    /** Skeleton root. */
    root?: Compound<Bone>

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

        const root = Compound.from(parent, (directory) => {
            const bone = new Bone()
            bone.read(directory)
            return bone
        })

        if (root.isCompound) this.root = root
    }

    write(parent: WritableDirectory): void {
        const multiLevel = parent.setDirectory('MultiLevel')

        multiLevel.setFile('Fractions').writeFloats(...this.fractions)

        for (const [index, mesh] of this.meshes.entries()) multiLevel.write(mesh, `Mesh${index}`)

        this.root?.write(parent)
    }
}
