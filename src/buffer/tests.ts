import { it } from 'node:test'
import { deepEqual, deepStrictEqual, strictEqual } from 'node:assert'
import { type Readable, type Writable } from './types.js'
import BufferView from './view.js'

export function writeAndRead<T extends Readable & Writable>(value: unknown): asserts value is T {
    if (!(typeof value === 'object' && value)) throw new TypeError('Is not an object')
    if (!('byteLength' in value)) throw new Error('Missing byteLength property')

    const { byteLength } = value
    
    if (typeof byteLength !== 'number') throw new TypeError('Byte length is not a number')
    if (!Number.isInteger(byteLength)) throw new TypeError('Byte length is not an integer')
    if (byteLength < 0 || byteLength > Number.MAX_SAFE_INTEGER) throw new RangeError('Byte range is invalid')
    
    const result = {...value}
    const view = BufferView.from(byteLength * 2)

    if (!('write' in value)) throw new Error('Missing write property')
    if (typeof value.write !== 'function') throw new TypeError('Write property is not a function')

    value.write(view)

    if (view.offset !== byteLength) throw new RangeError('Object has written less or more bytes than declared in byteLength')

    view.offset = 0 // Reset pointer

    if (!('read' in value)) throw new Error('Missing read property')
    if (typeof value.read !== 'function') throw new TypeError('Read propert is not a function')

    value.read(view)

    if (view.offset !== byteLength) throw new RangeError('Object has read less or more bytes than declared in byteLength')

    deepEqual(value, result)
}

export const testBufferObject = <T extends Readable & Writable>(actual: T, expected: T) =>
    it(`Testing buffer object ${actual.constructor.name}`, () => {
        const view = BufferView.from(actual.byteLength * 2) // Allocate buffer twice the requested.
        const { byteLength } = actual

        actual.write(view)
        strictEqual(view.offset, byteLength, 'Object has written less or more bytes than declared')

        // Reset view to start.
        view.offset = 0
        actual.read(view)

        strictEqual(view.offset, byteLength, 'Object has read less or more bytes than written previously')
        deepStrictEqual(actual, expected, 'Read object does not match written object')
    })
