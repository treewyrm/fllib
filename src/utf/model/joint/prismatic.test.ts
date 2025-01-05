import { describe } from 'node:test'
import { testBufferObject } from '../../../buffer/tests.js'
import Prismatic from './prismatic.js'

describe('Prismatic joint', () => {
    const joint = new Prismatic()
    const result = new Prismatic()

    testBufferObject(joint, result)
})
