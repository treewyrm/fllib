import { type BufferReader, type BufferWriter } from '../../buffer/types.js'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Get alchemy string byte length.
 * @param value
 * @returns
 */
export function getStringLength(value: string) {
    const length = encoder.encode(value).byteLength + 1
    return Uint16Array.BYTES_PER_ELEMENT + length + (length & 1)
}

/**
 * Read alchemy uint16 prefixed string.
 * @param view
 * @returns
 */
export function readString(view: BufferReader): string {
    // String length in prefix includes NUL termination byte.
    const length = view.readUint16()

    // However the actual buffer will always have even length;
    const buffer = new Uint8Array(length + (length & 1))
    view.readBuffer(buffer)

    return decoder.decode(buffer.subarray(0, buffer.indexOf(0)))
}

/**
 * Write alchemy uint16 prefixed string.
 * @param view
 * @param value
 * @returns
 */
export function writeString(view: BufferWriter, value: string): void {
    const buffer = encoder.encode(value)

    view.writeUint16(buffer.byteLength + 1) // To include NUL.
    view.writeBuffer(buffer)
    !(buffer.byteLength & 1) ? view.writeUint16(0) : view.writeUint8(0)
}
