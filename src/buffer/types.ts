/** Numeric type labels used by DataView and BufferView. */
type NumericTypes =
    | 'Int8'
    | 'Uint8'
    | 'Int16'
    | 'Uint16'
    | 'Int32'
    | 'Uint32'
    | 'BigInt64'
    | 'BigUint64'
    | 'Float32'
    | 'Float64'

/** Base BufferView template. */
interface BufferView<T> {
    /** View byte offset in underlying buffer. */
    readonly byteOffset: number

    /** Total view bytes length. */
    readonly byteLength: number

    /** Bytes remaining in view. */
    readonly byteRemain: number

    /** Current byte offset. */
    offset: number

    /** Byte order mode. */
    littleEndian: boolean

    /** Creates subview without advancing offset. */
    subarray(begin?: number, end?: number): T

    /** Creates subview for specified length from current offset. */
    slice(length?: number): T
}

/** BufferView limited to read methods. */
export interface BufferReader extends BufferView<BufferReader>, Pick<DataView, `get${NumericTypes}`> {
    /** Reads signed 8-bit integer from current offset. */
    readInt8(): number

    /** Reads unsigned 8-bit integer from current offset. */
    readUint8(): number

    /** Reads signed 16-bit integer from current offset. */
    readInt16(littleEndian?: boolean): number

    /** Reads unsigned 16-bit integer from current offset. */
    readUint16(littleEndian?: boolean): number

    /** Reads signed 32-bit integer from current offset. */
    readInt32(littleEndian?: boolean): number

    /** Reads unsigned 32-bit integer from current offset. */
    readUint32(littleEndian?: boolean): number

    /** Reads signed 64-bit integer from current offset. */
    readBigInt64(littleEndian?: boolean): bigint

    /** Reads unsiend 64-bit integer from current offset. */
    readBigUint64(littleEndian?: boolean): bigint

    /** Reads 32-bit float point number from current offset. */
    readFloat32(littleEndian?: boolean): number

    /** Reads 64-bit float point number from current offset. */
    readFloat64(littleEndian?: boolean): number

    /** Reads C-style NUL-terminated string from current offset. */
    readZString(): string

    /** Reads into array buffer view from current offset. */
    readBuffer(array: ArrayBufferView): void
}

/** BufferView limited to write methods. */
export interface BufferWriter extends BufferView<BufferWriter>, Pick<DataView, `set${NumericTypes}`> {
    /** Writes signed 8-bit integer at current offset. */
    writeInt8(value: number): void

    /** Writes unsigned 8-bit integer at current offset. */
    writeUint8(value: number): void

    /** Writes signed 16-bit integer at current offset. */
    writeInt16(value: number, littleEndian?: boolean): void

    /** Writes unsigned 16-bit integer at current offset. */
    writeUint16(value: number, littleEndian?: boolean): void

    /** Writes signed 32-bit integer at current offset. */
    writeInt32(value: number, littleEndian?: boolean): void

    /** Writes unsigned 32-bit integer at current offset. */
    writeUint32(value: number, littleEndian?: boolean): void

    /** Writes signed 64-bit integer at current offset. */
    writeBigInt64(value: bigint, littleEndian?: boolean): void

    /** Writes unsigned 64-bit integer at current offset. */
    writeBigUint64(value: bigint, littleEndian?: boolean): void

    /** Writes 32-bit float point number at current offset. */
    writeFloat32(value: number, littleEndian?: boolean): void

    /** Writes 64-bit float point number at current offset. */
    writeFloat64(value: number, littleEndian?: boolean): void

    /** Writes C-style NUL-terminated string at current offset. */
    writeZString(value: string): void

    /** Writes array buffer view at current offset. */
    writeBuffer(array: ArrayBufferView): void
}

/** Object can be serialized by BufferWriter. */
export interface Writable {
    readonly byteLength: number

    /** Serialize object. */
    write(view: BufferWriter): void
}

/** Object can be deserialized by BufferReader. */
export interface Readable {
    readonly byteLength: number

    /** Deserialize object. */
    read(view: BufferReader): void
}
