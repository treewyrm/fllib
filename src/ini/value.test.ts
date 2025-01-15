import { deepStrictEqual, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import Value, { toBoolean, toInteger, toFloat, toString, format } from './value.js'

describe('Type casting', () => {
    describe('Value to boolean', () => {
        it('Undefined is false', () => strictEqual(toBoolean(undefined), false))
        it('Null is false', () => strictEqual(toBoolean(null), false))
        it('Empty object is false', () => strictEqual(toBoolean({}), false))
        it('0 is false', () => strictEqual(toBoolean(0), false))
        it('1 is true', () => strictEqual(toBoolean(1), true))
        it('"true" is true', () => strictEqual(toBoolean('true'), true))
        it('"false" is false', () => strictEqual(toBoolean('false'), false))
    })

    describe('Value to integer number', () => {
        it('Undefined is 0', () => strictEqual(toInteger(undefined), 0))
        it('Null is 0', () => strictEqual(toInteger(null), 0))
        it('Empty object is 0', () => strictEqual(toInteger({}), 0))
        it('True is 1', () => strictEqual(toInteger(true), 1))
        it('False is 0', () => strictEqual(toInteger(false), 0))
        it('"100" is 100', () => strictEqual(toInteger('100'), 100))
        it('"-100" is -100', () => strictEqual(toInteger('-100'), -100))
        it('"3.14" is 3', () => strictEqual(toInteger('3.14'), 3))
    })

    describe('Value to float number', () => {
        it('Undefined is 0.0', () => strictEqual(toFloat(undefined), 0.0))
        it('Null is 0.0', () => strictEqual(toFloat(null), 0.0))
        it('Empty object is 0.0', () => strictEqual(toFloat({}), 0.0))
        it('True is 1.0', () => strictEqual(toFloat(true), 1.0))
        it('False is 0.0', () => strictEqual(toFloat(false), 0.0))
        it('Math.PI is Math.fround(Math.PI)', () => strictEqual(toFloat(Math.PI), Math.fround(Math.PI)))
    })

    describe('Value to string', () => {
        it('Undefined is ""', () => strictEqual(toString(undefined), ''))
        it('Null is ""', () => strictEqual(toString(null), ''))
        it('Empty object is 0.0', () => strictEqual(toString({}), ''))
        it('True is "true"', () => strictEqual(toString(true), 'true'))
        it('False is "false"', () => strictEqual(toString(false), 'false'))
        it('Math.PI is "3.141592653589793"', () => strictEqual(toString(Math.PI), '3.141592653589793'))
    })

    describe('Formatting values', () => {
        const values1: Value[] = ['object_name', true, 8000, Math.SQRT2, -100.998, 1.1]

        const values2: Value[] = ['text', true, 100, 1000, 10000]

        const values3: Value[] = ['value', true]

        it('Matching types', () =>
            deepStrictEqual(format(values1, 'string', 'boolean', 'integer', 'float', 'float', 'float'), [
                'object_name',
                true,
                8000,
                Math.fround(Math.SQRT2),
                Math.fround(-100.998),
                Math.fround(1.1),
            ]))

        it('Matching remaining types', () =>
            deepStrictEqual(format(values2, 'string', 'boolean', 'integer'), ['text', true, 100, 1000, 10000]))

        // Undefined becomes whatever default is type cast into.
        it('Exceeding values', () =>
            deepStrictEqual(format(values3, 'string', 'boolean', 'integer'), ['value', true, 0]))
    })
})
