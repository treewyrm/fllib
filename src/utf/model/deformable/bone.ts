import { type ReadableDirectory, type WritableDirectory } from '../../types.js'
import Part from '../part.js'
import BoneToRoot from './boneToRoot.js'

export default class Bone extends Part {
    boneToRoot = new BoneToRoot()
    LODBits = 0

    read(parent: ReadableDirectory): void {
        super.read(parent)
        parent.read(this.boneToRoot)

        ;[this.LODBits = 0] = parent.getFile('Lod Bits')?.readIntegers() ?? []
    }

    write(parent: WritableDirectory): void {
        super.write(parent)
        parent.write(this.boneToRoot)
        
        parent.setFile('Lod Bits').writeIntegers(this.LODBits)
    }
}