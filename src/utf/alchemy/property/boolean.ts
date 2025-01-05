import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { type Property } from '../types.js'

/** Static boolean property. */
export default class BooleanProperty implements Property<boolean> {
    static readonly type = 0x1
    static readonly typeName = 'boolean'

    readonly type = BooleanProperty.type

    constructor(
        /** Boolean property value. */
        public value = false
    ) {}

    get byteLength() {
        // Boolean uses most significant bit in type.
        return 0
    }

    read(view: BufferReader) {
        const offset = view.offset - Uint16Array.BYTES_PER_ELEMENT - Uint32Array.BYTES_PER_ELEMENT
        this.value = (view.getUint16(offset, view.littleEndian) & 0x8000) > 0
    }

    write(view: BufferWriter & BufferReader) {
        const offset = view.offset - Uint16Array.BYTES_PER_ELEMENT - Uint32Array.BYTES_PER_ELEMENT
        view.setUint16(offset, view.getUint16(offset, view.littleEndian) | 0x8000, view.littleEndian)
    }

    toJSON() {
        return this.value
    }
}
