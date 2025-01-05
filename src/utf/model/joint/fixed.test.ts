import { describe } from 'node:test'
import { testBufferObject } from '../../../buffer/tests.js'
import Fixed from './fixed.js'

describe('Fixed joint', () => {
    const joint = new Fixed()
    const result = new Fixed()

    testBufferObject(joint, result)
})
