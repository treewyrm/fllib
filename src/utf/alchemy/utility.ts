import { VectorLike } from '../../math/vector.js'
import { Easing } from './easing.js'
import { type Keyframe } from './types.js'
import { Animation } from '../../math/index.js'

interface KeyframeProperty<T> {
    keyframes: Keyframe<T>[]
}

export const upsertKeyframe = <T>(keyframes: Keyframe<T>[], key: number, value: T): Keyframe<T> => {
    let keyframe = keyframes.find((keyframe) => keyframe.key === key)
    keyframe ? (keyframe.value = value) : keyframes.push((keyframe = { key, value }))
    return keyframe
}

// /**
//  * Insert animated property keyframe.
//  * @param property
//  * @param parameter
//  * @param time
//  * @param value
//  * @param method
//  */
// export const insertKeyframe = <T>(
//     property: KeyframeProperty<KeyframeProperty<T>>,
//     parameter: number,
//     time: number,
//     value: T,
//     method: 'before' | 'after' | 'override' = 'override'
// ): void => {
//     // Find parameter keyframe or create a new one.
//     let pKeyframe = property.keyframes.find(({ key }) => key === parameter)

//     // Add parameter keyframe if one does not exist.
//     if (!pKeyframe) property.keyframes.push((pKeyframe = { key: parameter, value: { keyframes: [] } }))

//     // Get time keyframe.
//     // let index = pKeyframe.value.keyframes.findIndex(({ key }) => key === time)
// }

/**
 *
 * @param property
 * @param parameter
 * @param time
 * @returns
 */
export const deleteKeyframe = (
    property: KeyframeProperty<KeyframeProperty<unknown>>,
    parameter: number,
    time: number
): void => {
    let index = -1

    for (const { value } of property.keyframes.filter(({ key }) => key === parameter))
        while ((index = value.keyframes.findIndex(({ key }) => key === time)) >= 0) value.keyframes.splice(index, 1)
}

export const hasKeyframes = (property: KeyframeProperty<unknown>) => property.keyframes.length > 0

export const cleanKeyframes = (property: KeyframeProperty<KeyframeProperty<unknown>>) => {
    // Sort and condense value keyframes (there should be max two keyframes of different values for a given key).

    // Remove parameter keyframes without subkeyframes.
    property.keyframes = property.keyframes.filter((keyframe) => hasKeyframes(keyframe.value))
}

/**
 * Test animated property to have at least one parameter keyframe and each parameter keyframe to have at least one sub keyframe.
 * @param property
 */
export const requireKeyframes = ({ keyframes }: KeyframeProperty<KeyframeProperty<unknown>>) => {
    if (!keyframes.length) throw new RangeError(`Animated property cannot have zero parameter keyframes.`)
    if (!keyframes.every(({ value: { keyframes } }) => keyframes.length > 0))
        throw new RangeError(`Some parameter keyframes are empty in animated property`)
}

export const sortProperty = ({ keyframes }: KeyframeProperty<KeyframeProperty<unknown>>) => (
    Animation.sort(keyframes), keyframes.forEach(({ value: { keyframes } }) => Animation.sort(keyframes))
)

/**
 * Convert hermite curve segment to easing type.
 * @param index
 * @param type
 * @returns
 */
export const setCurveEasing = (start: Keyframe<VectorLike>, end: Keyframe<VectorLike>, type: Easing): void => {
    const t = Math.abs(end.key - start.key)
    const v = start.value.x - end.value.x

    end.value.z = start.value.y = 0

    switch (type) {
        case Easing.Linear:
            end.value.z = start.value.y = v / t
            break
        case Easing.EaseIn:
            end.value.z = v / (t * 0.5)
            break
        case Easing.EaseOut:
            start.value.y = v / (t * 0.5)
            break
    }
}
