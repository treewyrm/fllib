import { type BufferReader, type BufferWriter } from '../../../buffer/types.js';
import { type Property } from '../types.js';

export enum BlendingMode {
    None,
    Zero,
    One,
    SourceColor,
    InverseSourceColor,
    SourceAlpha,
    InverseSourceAlpha,
    DestinationAlpha,
    InverseDestinationAlpha,
    DestinationColor,
    InverseDestinationColor,
    SourceAlphaSAT,
}

type BlendingValue = { source: BlendingMode; destination: BlendingMode }

/** Static blending mode property. */
export default class BlendProperty implements Property<BlendingValue> {
    static readonly type = 0x104
    static readonly typeName = 'blend'

    value: BlendingValue

    constructor(source = BlendingMode.SourceAlpha, destination = BlendingMode.One) {
        this.value = { source, destination }
    }

    get byteLength() {
        return Uint32Array.BYTES_PER_ELEMENT * 2
    }

    read(view: BufferReader) {
        this.value.source = view.readUint32()
        this.value.destination = view.readUint32()
    }

    write(view: BufferWriter) {
        view.writeUint32(this.value.source)
        view.writeUint32(this.value.destination)
    }

    toJSON() {
        return {
            source: this.value.source,
            destination: this.value.destination,
        }
    }
}
