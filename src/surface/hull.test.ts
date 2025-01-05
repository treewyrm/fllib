import { describe } from 'node:test'
import Hull from './hull.js'
import { testBufferObject } from '../buffer/tests.js'

describe('Hull', () => {
    const source = new Hull()
    source.faces.push(
        {
            state: [true, true, true],
            flag: 0,
            opposite: 0,
            edges: [0, 1, 2],
            adjacent: [1, 2, 0],
        },
        {
            state: [true, true, true],
            flag: 0,
            opposite: 1,
            edges: [2, 1, 0],
            adjacent: [0, 1, 2],
        }
    )

    const target = new Hull()

    // Create a copy of faces for target.
    target.faces = source.faces.map((face) => ({ ...face }))

    testBufferObject(source, target)
})
