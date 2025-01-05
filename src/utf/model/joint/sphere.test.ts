import { describe } from 'node:test'
import { testBufferObject } from '../../../buffer/tests.js'
import Sphere from './sphere.js'

describe('Sphere joint', () => {
    const joint = new Sphere()
    const result = new Sphere()

    testBufferObject(joint, result)
})
