import { describe, it } from 'node:test'
import AnimatedFloatProperty from './animatedFloat.js'
import { EasingType } from '../easing.js'
import { strictEqual } from 'node:assert'
import { writeAndRead } from '../../../buffer/tests.js'

describe('Animated float property', () => {
    const property = new AnimatedFloatProperty()

    property.keyframes = [
        {
            key: 0,
            value: {
                easing: EasingType.Linear,
                keyframes: [
                    {
                        key: 0,
                        value: 0,
                    },
                    {
                        key: 1,
                        value: 1,
                    },
                ],
            },
        },
    ]

    it('Evaluating', () => strictEqual(property.at(0, 0.5), 0.5))
    writeAndRead(property)
})
