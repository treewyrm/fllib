import { type BufferReader, type BufferWriter } from '../../../buffer/types.js'
import { type Property } from '../types.js'
import { MaxFloat, clamp } from '../../../math/scalar.js'

/** Static float property. */
export default class FloatProperty implements Property<number> {
    static readonly type = 0x3
    static readonly typeName = 'float'

    constructor(
        /** Float property value. */
        public value = 0
    ) {}

    get byteLength() {
        return Float32Array.BYTES_PER_ELEMENT
    }

    read(view: BufferReader) {
        this.value = view.readFloat32()

        if (this.value >= MaxFloat) this.value = Infinity
        else if (this.value <= -MaxFloat) this.value = -Infinity
    }

    write(view: BufferWriter) {
        view.writeFloat32(clamp(this.value, -MaxFloat, +MaxFloat))
    }

    toJSON() {
        return this.value
    }
}
