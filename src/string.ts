const decoder = new TextDecoder()

/**
 * Reads NUL-terminated string from byte array.
 * @param view Dictionary buffer
 * @param offset Name offset
 * @returns
 */
export const readString = (view: Uint8Array, offset: number): string => {
    const index = view.indexOf(0, offset)
    return decoder.decode(view.subarray(offset, index < 0 ? undefined : index))
}

/**
 * Asserts value is a string and contains only printable characters in ASCII range.
 * @param value
 */
export function printable(value: unknown): asserts value is string {
    if (typeof value !== 'string') throw new TypeError('Value is not a string')

    for (let i = 0, l = value.length, code: number; i < l; i++) {
        code = value.charCodeAt(i)

        if (!(code >= 0x20 && code < 0x7f))
            throw new RangeError(`String contains non-printable character code at position ${i}: ${code.toString(16)}`)
    }
}
