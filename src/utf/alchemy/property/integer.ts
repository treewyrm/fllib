import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { type Property } from '../types.js'

/** Static integer property. */
export default class IntegerProperty implements Property<number> {
    static readonly type = 0x2
    static readonly typeName = 'integer'

    constructor(
        /** Integer property value. */
        public value = 0
    ) {}

    get byteLength() {
        return Int32Array.BYTES_PER_ELEMENT
    }

    read(view: BufferReader) {
        this.value = view.readInt32()
    }

    write(view: BufferWriter) {
        view.writeInt32(this.value)
    }

    toJSON() {
        return this.value
    }
}
