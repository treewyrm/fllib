import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import VMeshRef from './vmeshref.js'

export default class VMeshPart {
    readonly kind = 'directory'

    constructor(
        /** Reference to VMeshData. */
        readonly reference = new VMeshRef()
    ) {}

    read(parent: ReadableDirectory): void {
        parent.read(this.reference)
    }

    write(parent: WritableDirectory): void {
        parent.write(this.reference)
    }
}
