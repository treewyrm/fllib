import { describe, it } from 'node:test'
import AnimatedCurveProperty from './animatedCurve.js'
import { WrapFlags } from '../wrap.js'
import { strictEqual } from 'node:assert'

// const items: any[] = []

// for (let t = -100; t <= 100; t += 2.5) {
//     items.push({
//         property: 0,
//         time: t,
//         value: '-'.repeat(propertyCon.at(0, t) + 30)
//     })
// }

// console.table(items)

describe('Animated curve', () => {
    describe('Before mirror and stop', () => {
        const property = new AnimatedCurveProperty()

        property.keyframes = [
            {
                key: 0,
                value: {
                    defaultValue: 0,
                    flags: WrapFlags.BeforeMirror,
                    keyframes: [
                        { key: 50, value: { x: 0, y: 0, z: 0 } },
                        { key: 150, value: { x: 50, y: 0, z: 0 } },
                    ],
                },
            },
        ]

        // Mirrored repetition before first keyframe.
        it('Matching time -25', () => strictEqual(property.at(0, -25), 42.1875))
        it('Matching time 0', () => strictEqual(property.at(0, 0), 25))
        it('Matching time 25', () => strictEqual(property.at(0, 25), 7.8125))

        // First keyframe starts at 50.
        it('Matching time 50', () => strictEqual(property.at(0, 50), 0))
        it('Matching time 100', () => strictEqual(property.at(0, 100), 25))
        it('Matching time 125', () => strictEqual(property.at(0, 125), 42.1875))
        it('Matching time 150', () => strictEqual(property.at(0, 150), 50))

        // Resets to first keyframe but does not play again.
        it('Matching time 200', () => strictEqual(property.at(0, 200), 0))
    })

    describe('Repeat and continue', () => {
        const property = new AnimatedCurveProperty()

        property.keyframes = [
            {
                key: 0,
                value: {
                    defaultValue: 0,
                    flags:
                        WrapFlags.BeforeRepeat |
                        WrapFlags.AfterRepeat |
                        WrapFlags.BeforeContinue |
                        WrapFlags.AfterContinue,
                    keyframes: [
                        { key: 25, value: { x: 0, y: 0, z: 0 } },
                        { key: 75, value: { x: 10, y: 0, z: 0 } },
                    ],
                },
            },
        ]

        // Before curve.
        it('Matching time 0', () => strictEqual(property.at(0, 0), -5))
        it('Matching time 12.5', () => strictEqual(property.at(0, 12.5), -1.5625))

        // Curve.
        it('Matching time 25', () => strictEqual(property.at(0, 25), 0))
        it('Matching time 37.5', () => strictEqual(property.at(0, 37.5), 1.5625))
        it('Matching time 50', () => strictEqual(property.at(0, 50), 5))
        it('Matching time 62.5', () => strictEqual(property.at(0, 62.5), 8.4375))
        it('Matching time 75', () => strictEqual(property.at(0, 75), 10))

        // After curve.
        it('Matching time 87.5', () => strictEqual(property.at(0, 87.5), 11.5625))
        it('Matching time 100', () => strictEqual(property.at(0, 100), 15))
    })
})
