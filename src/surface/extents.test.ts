import { describe } from 'node:test'
import Extents from './extents.js'
import { testBufferObject } from '../buffer/tests.js'

describe('Extents section', () => {
    const source = new Extents()
    const target = new Extents()

    testBufferObject(source, target)
})
