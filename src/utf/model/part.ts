import { type ReadsDirectory, type WritesDirectory, type ReadableDirectory, type WritableDirectory } from '../types.js'
import HardpointLibrary from './hardpoint/library.js'

/** Basic model part. */
export default class Part implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'
    readonly isCompound = false

    get [Symbol.toStringTag]() {
        return 'Part'
    }

    /** Attachment points. */
    hardpoints = new HardpointLibrary()

    read(parent: ReadableDirectory): void {
        parent.read(this.hardpoints)
    }

    write(parent: WritableDirectory): void {
        parent.write(this.hardpoints)
    }
}
