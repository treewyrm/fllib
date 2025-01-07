import {
    type ReadableDirectory,
    type ReadsDirectory,
    type WritableDirectory,
    type WritesDirectory,
} from '../../types.js'
import FaceGroup from './facegroup.js'
import Geometry from './geometry.js'

/** Deformable mesh. */
export default class Mesh implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'

    groups: FaceGroup[] = []
    geometry = new Geometry()

    read(parent: ReadableDirectory): void {
        const groups = parent.getDirectory('Face_groups')
        if (!groups) throw new Error('Deformable mesh is missing Face_groups folder')

        const [count = 0] = groups.getFile('Count')?.readIntegers() ?? []

        for (let i = 0; i < count; i++) {
            const group = groups.read(new FaceGroup(), `Group_${i}`)
            if (!group) throw new Error(`Deformable mesh is missing face group ${i}`)

            this.groups[i] = group
        }

        parent.read(this.geometry)
    }

    write(parent: WritableDirectory): void {
        const groups = parent.setDirectory('Face_groups')
        groups.setFile('Count').writeIntegers(this.groups.length)

        for (const [index, group] of this.groups.entries()) groups.write(group, `Group_${index}`)

        parent.write(this.geometry)
    }
}
