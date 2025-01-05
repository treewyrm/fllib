import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { type Property } from '../types.js'
import { getStringLength, readString, writeString } from '../string.js'

/** Static string property. */
export default class StringProperty implements Property<string> {
    static readonly type = 0x103
    static readonly typeName = 'string'

    constructor(
        /** String property value. */
        public value = ''
    ) {}

    get byteLength() {
        return getStringLength(this.value)
    }

    read(view: BufferReader) {
        this.value = readString(view)
    }

    write(view: BufferWriter) {
        writeString(view, this.value)
    }

    toJSON() {
        return this.value
    }
}
