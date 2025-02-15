import { type ReadableDirectory, type WritableDirectory } from '../../types.js'
import ObjectMap from './objectmap.js'

export default class JointMap extends ObjectMap {
    child = ''

    get byteLength() {
        return super.byteLength + this.child.length + 1
    }

    read(parent: ReadableDirectory): void {
        ;[this.child = ''] = parent.getFile('Child name')?.readStrings() ?? []
        super.read(parent)
    }

    write(parent: WritableDirectory): void {
        parent.setFile('Child name').writeStrings(this.child)
        super.write(parent)
    }
}
