import { type Resource } from '../library.js'
import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import VMeshData from './vmeshdata.js'

export default class VMesh implements Resource {
    readonly kind = 'directory'

    /** Mesh buffer. */
    data = new VMeshData()

    get byteLength() {
        return this.data.byteLength
    }

    read(parent: ReadableDirectory): void {
        parent.read(this.data)
    }

    write(parent: WritableDirectory): void {
        parent.write(this.data)
    }
}
