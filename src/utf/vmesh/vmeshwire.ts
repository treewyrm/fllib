import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import VWireData from './vwiredata.js'

export default class VMeshWire {
    readonly kind = 'directory'

    constructor(
        /** Wireframe data. */
        readonly data = new VWireData()
    ) {}

    read(parent: ReadableDirectory): void {
        parent.read(this.data)
    }

    write(parent: WritableDirectory): void {
        parent.write(this.data)
    }
}
