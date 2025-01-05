import { describe, it } from 'node:test'
import AnimatedColorProperty from './animatedColor.js'
import { EasingType } from '../easing.js'
import { deepStrictEqual } from 'node:assert'
import { writeAndRead } from '../../../buffer/tests.js'

describe('Animated color property', () => {
    const property = new AnimatedColorProperty()

    property.keyframes = [
        {
            key: 0,
            value: {
                easing: EasingType.Linear,
                keyframes: [
                    {
                        key: 0,
                        value: {
                            x: 1,
                            y: 0,
                            z: 0,
                        },
                    },
                    {
                        key: 1,
                        value: {
                            x: 0,
                            y: 0,
                            z: 1,
                        },
                    },
                ],
            },
        },
    ]

    it('Evaluating property', () => deepStrictEqual(property.at(0, .5), { x: .5, y: 0, z: .5 }))

    writeAndRead(property)
})
