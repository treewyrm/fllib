import { clamp } from '../math/scalar.js'
import { BufferReader, BufferWriter, Readable, Writable } from './types.js'

const decoder = new TextDecoder()
const encoder = new TextEncoder()

export default class BufferView<T extends ArrayBufferLike = ArrayBufferLike>
    extends DataView<T>
    implements BufferReader, BufferWriter
{
    /** Byte order. */
    littleEndian = true

    /** Current offset in view. */
    offset = 0

    /** Bytes remaining from the current byte offset. */
    get byteRemain(): number {
        return this.byteLength - clamp(this.offset, 0, this.byteLength)
    }

    /**
     * Create view from number (byteLength), string, ArrayBufferView or Writable object.
     * @param value 
     * @returns 
     */
    static from(value: number | string | ArrayBufferView | Writable): BufferView {
        if (typeof value === 'number') return new this(new ArrayBuffer(value))
        if (typeof value === 'string') return new this(encoder.encode(value).buffer)
        if (ArrayBuffer.isView(value)) return new this(value.buffer, value.byteOffset, value.byteLength)

        if (isWritable(value)) {
            const view = this.from(value.byteLength)
            value.write(view)
            return view
        }

        return new this(new ArrayBuffer())
    }

    /**
     * Create new view from begin to end offsets. Does not affect the offset.
     * @param begin Start byte offset.
     * @param end End byte offset.
     * @returns
     */
    subarray(begin?: number, end?: number): BufferView<T> {
        const { byteOffset, byteLength } = new Uint8Array(this.buffer, this.byteOffset, this.byteLength).subarray(
            begin,
            end
        )

        return new BufferView(this.buffer, byteOffset, byteLength)
    }

    /**
     * Creates new view from the current byte offset and advances offset.
     * @param length Byte length to slice.
     * @returns
     */
    slice(length?: number): BufferView<T> {
        const view = new BufferView(this.buffer, this.byteOffset + this.offset, length)
        this.offset += view.byteLength
        return view
    }

    /**
     * Shifts internal byte offset by specified amount but returns previous value. Post-increment.
     * @param length Amount of bytes to shift by.
     * @returns Offset value before shift.
     */
    shift(length: number): number {
        const { offset } = this
        this.offset = offset + length
        return offset
    }

    /**
     * Reads object from the current byte offset.
     * After reading offset is set to position of start + byteLength of the object.
     * @param value Readable object
     * @param byteLength Limit reading object to byte length
     * @returns
     */
    read<T extends Readable>(value: T, byteLength?: number): T {
        const start = this.offset

        value.read(this.subarray(this.offset, byteLength ? this.offset + byteLength : undefined))

        this.offset = start + value.byteLength
        return value
    }

    /**
     * Writes object at the current byte offset.
     * After writing offset is set to position of start + byteLength of the object.
     * @param value Writable object
     * @param byteLength Limit writing object to byte length
     * @returns
     */
    write<T extends Writable>(value: T, byteLength = value.byteLength): T {
        const start = this.offset

        value.write(this.subarray(this.offset, this.offset + byteLength))

        this.offset = start + byteLength
        return value
    }

    /**
     * Reads the Uint8 value at the current byte offset.
     * @returns
     */
    readUint8(): number {
        return this.getUint8(this.shift(Uint8Array.BYTES_PER_ELEMENT))
    }

    /**
     * Writes an Uint8 at the current byte offset.
     * @param value Value to write.
     * @returns
     */
    writeUint8(value: number): void {
        return this.setUint8(this.shift(Uint8Array.BYTES_PER_ELEMENT), value)
    }

    /**
     * Reads the Int8 value at the current byte offset.
     * @returns
     */
    readInt8(): number {
        return this.getInt8(this.shift(Int8Array.BYTES_PER_ELEMENT))
    }

    /**
     * Writes an Int8 at the current byte offset.
     * @param value Value to write.
     * @returns
     */
    writeInt8(value: number): void {
        return this.setInt8(this.shift(Int8Array.BYTES_PER_ELEMENT), value)
    }

    /**
     * Reads the Uint16 value at the current byte offset.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    readUint16(littleEndian = this.littleEndian): number {
        return this.getUint16(this.shift(Uint16Array.BYTES_PER_ELEMENT), littleEndian)
    }

    /**
     * Writes an Uint16 at the current byte offset.
     * @param value Value to write.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    writeUint16(value: number, littleEndian = this.littleEndian): void {
        return this.setUint16(this.shift(Uint16Array.BYTES_PER_ELEMENT), value, littleEndian)
    }

    /**
     * Reads the Int16 value at the current byte offset.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    readInt16(littleEndian = this.littleEndian): number {
        return this.getInt16(this.shift(Int16Array.BYTES_PER_ELEMENT), littleEndian)
    }

    /**
     * Writes an Int16 at the current byte offset.
     * @param value Value to write.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    writeInt16(value: number, littleEndian = this.littleEndian): void {
        return this.setInt16(this.shift(Int16Array.BYTES_PER_ELEMENT), value, littleEndian)
    }

    /**
     * Reads the Uint32 value at the current byte offset.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    readUint32(littleEndian = this.littleEndian): number {
        return this.getUint32(this.shift(Uint32Array.BYTES_PER_ELEMENT), littleEndian)
    }

    /**
     * Writes an Uint32 at the current byte offset.
     * @param value Value to write.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    writeUint32(value: number, littleEndian = this.littleEndian): void {
        return this.setUint32(this.shift(Uint32Array.BYTES_PER_ELEMENT), value, littleEndian)
    }

    /**
     * Reads the Int32 value at the current byte offset.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    readInt32(littleEndian = this.littleEndian): number {
        return this.getInt32(this.shift(Int32Array.BYTES_PER_ELEMENT), littleEndian)
    }

    /**
     * Writes an Int32 at the current byte offset.
     * @param value Value to write.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    writeInt32(value: number, littleEndian = this.littleEndian): void {
        return this.setInt32(this.shift(Int32Array.BYTES_PER_ELEMENT), value, littleEndian)
    }

    /**
     * Reads the Uint64 value at the current byte offset.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    readBigUint64(littleEndian = this.littleEndian): bigint {
        return this.getBigUint64(this.shift(BigUint64Array.BYTES_PER_ELEMENT), littleEndian)
    }

    /**
     * Writes an Uint64 at the current byte offset.
     * @param value Value to write.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    writeBigUint64(value: bigint, littleEndian = this.littleEndian): void {
        return this.setBigUint64(this.shift(BigUint64Array.BYTES_PER_ELEMENT), value, littleEndian)
    }

    /**
     * Reads the Int64 value at the current byte offset.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    readBigInt64(littleEndian = this.littleEndian): bigint {
        return this.getBigInt64(this.shift(BigInt64Array.BYTES_PER_ELEMENT), littleEndian)
    }

    /**
     * Writes an Int64 at the current byte offset.
     * @param value Value to write.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    writeBigInt64(value: bigint, littleEndian = this.littleEndian): void {
        return this.setBigInt64(this.shift(BigInt64Array.BYTES_PER_ELEMENT), value, littleEndian)
    }

    /**
     * Reads the Float32 value at the current byte offset.
     * @param littleEndian
     * @returns
     */
    readFloat32(littleEndian = this.littleEndian): number {
        return this.getFloat32(this.shift(Float32Array.BYTES_PER_ELEMENT), littleEndian)
    }

    /**
     * Writes a Float32 at the current byte offset.
     * @param value Value to write.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    writeFloat32(value: number, littleEndian = this.littleEndian): void {
        return this.setFloat32(this.shift(Float32Array.BYTES_PER_ELEMENT), value, littleEndian)
    }

    /**
     * Reads the Float64 value at the current byte offset.
     * @param littleEndian
     * @returns
     */
    readFloat64(littleEndian = this.littleEndian): number {
        return this.getFloat64(this.shift(Float64Array.BYTES_PER_ELEMENT), littleEndian)
    }

    /**
     * Writes a Float64 at the current byte offset.
     * @param value Value to write.
     * @param littleEndian Overrides default endianness setting of the view.
     * @returns
     */
    writeFloat64(value: number, littleEndian = this.littleEndian): void {
        return this.setFloat64(this.shift(Float64Array.BYTES_PER_ELEMENT), value, littleEndian)
    }

    /**
     * Reads bytes into specified buffer from the current byte offset.
     * @param value Buffer to copy into.
     * @returns
     */
    readBuffer({ buffer, byteOffset, byteLength }: ArrayBufferView): void {
        return new Uint8Array(buffer, byteOffset, byteLength).set(
            new Uint8Array(this.buffer, this.byteOffset + this.shift(byteLength), byteLength)
        )
    }

    /**
     * Writes bytes from specified buffer at the current byte offset.
     * @param value Buffer to copy from.
     * @returns
     */
    writeBuffer({ buffer, byteOffset, byteLength }: ArrayBufferView): void {
        return new Uint8Array(this.buffer, this.byteOffset + this.shift(byteLength), byteLength).set(
            new Uint8Array(buffer, byteOffset, byteLength)
        )
    }

    /**
     * Reads ASCIIZ string from the current byte offset.
     * @returns
     */
    readZString(): string {
        let buffer = new Uint8Array(this.buffer, this.byteOffset + this.offset, this.byteRemain)
        const index = buffer.indexOf(0)

        buffer = buffer.subarray(0, index < 0 ? undefined : index)
        this.offset += buffer.byteLength + (index < 0 ? 0 : 1)
        return decoder.decode(buffer)
    }

    /**
     * Writes ASCIIZ string at the current byte offset.
     * @param value
     */
    writeZString(value: string): void {
        const { written } = encoder.encodeInto(
            value + '\0',
            new Uint8Array(this.buffer, this.byteOffset + this.offset, this.byteRemain)
        )
        this.offset += written
    }
}

export const isWritable = (value: unknown): value is Writable =>
    typeof value === 'object' &&
    value !== null &&
    'byteLength' in value &&
    typeof value.byteLength === 'number' &&
    'write' in value &&
    typeof value.write === 'function'

export const isReadable = (value: unknown): value is Readable =>
    typeof value === 'object' &&
    value !== null &&
    'byteLength' in value &&
    typeof value.byteLength === 'number' &&
    'read' in value &&
    typeof value.read === 'function'
