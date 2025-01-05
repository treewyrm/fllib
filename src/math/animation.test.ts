import { describe, it } from 'node:test'
import { deepStrictEqual } from 'node:assert'
import * as Animation from './animation.js'

describe('Animation functions', () => {
    const keyframes: Animation.Keyframe<number>[] = [
        {
            key: 0,
            value: -100,
        },
        {
            key: 10,
            value: -20,
        },
        {
            key: 40,
            value: 20,
        },
        {
            key: 100,
            value: 100,
        },
    ]

    it('Before first keyframe', () => deepStrictEqual(Animation.at(keyframes, -10), [0, -100, -100]))
    it('After last keyframe', () => deepStrictEqual(Animation.at(keyframes, 110), [0, 100, 100]))
})
