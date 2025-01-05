import { describe, it } from 'node:test'
import { deepStrictEqual, strictEqual } from 'node:assert'
import File from './file.js'

describe('UTF file', () => {
    it('Creating empty file', () => {
        const file = new File()
        strictEqual(file.byteLength, 0)
    })

    it('Creating file with allocated byte length', () => {
        const file = new File(16)
        strictEqual(file.byteLength, 16)
    })

    it('Creating file with string data', () => {
        const file = new File('Hello')
        strictEqual(file.byteLength, 6) // NUL termination
        deepStrictEqual([...file.readStrings()], ['Hello'])
    })

    it('Sequence of integers', () => {
        const file = new File()
        const values = [10, 400, 0xffff, 900000]

        file.writeIntegers(...values)

        strictEqual(file.byteLength, 16)
        deepStrictEqual([...file.readIntegers()], values)
    })

    it('Sequence of floats', () => {
        const file = new File()
        const values = [Math.PI, Math.SQRT1_2, Math.SQRT2]

        file.writeFloats(...values)

        strictEqual(file.byteLength, 12)
        deepStrictEqual([...file.readFloats()], values.map(Math.fround))
    })

    it('Sequence of strings', () => {
        const file = new File()
        const values = ['Hello', 'world', 'and', 'others']

        file.writeStrings(...values)

        strictEqual(file.byteLength, 23)
        deepStrictEqual([...file.readStrings()], values)
    })
})
