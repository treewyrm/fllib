import * as Scalar from './scalar.js'

/** Generic keyframe object. */
export type Keyframe<T> = { key: number; value: T }

/** Weighted result. */
export type ValueTuple<T> = [start: T, end: T, weight: number]

/** Key range. */
export type Range = [start: number, end: number]

/**
 * Sorts keyframes in array.
 * @param keyframes
 * @returns
 */
export const sort = <T>(keyframes: Keyframe<T>[]) => keyframes.sort(({ key: a }, { key: b }) => a - b)

/**
 * Gets key range from first and last keyframes.
 * @param keyframes
 * @returns
 */
export const range = (keyframes: Keyframe<unknown>[]): Range => [
    keyframes.at(0)?.key ?? Infinity,
    keyframes.at(-1)?.key ?? -Infinity,
]

/**
 * Gets difference between last and first key.
 * - Result is greater or equal to 0.
 * - Assumes keyframes are sorted.
 * @param keyframes
 * @returns
 */
export const duration = (keyframes: Keyframe<unknown>[]): number => {
    const [start, end] = range(keyframes)
    return Math.max(0, end - start)
}

/**
 * Gets range from unsorted keyframes.
 * @param keyframes
 * @returns
 */
export const rangeUnsorted = (keyframes: Iterable<Keyframe<unknown>>): Range => {
    let start = Infinity
    let end = -Infinity

    for (const { key } of keyframes) {
        start = Math.min(start, key)
        end = Math.max(end, key)
    }

    return [start, end]
}

/**
 * Gets difference between last and first key.
 * @param keyframes
 * @returns
 */
export const durationUnsorted = (keyframes: Iterable<Keyframe<unknown>>): number => {
    const [start, end] = rangeUnsorted(keyframes)
    return Math.max(end - start)
}

/**
 * Finds pair of keyframes for the given relative key, ignores keyframe key and treats all keyframes as equidistant.
 * @param keyframes Sorted keyframes
 * @param key Normalized key (0.0 to 1.0)
 * @returns Value tuple
 */
export const atEquidistantKeyframes = <T>(keyframes: Keyframe<T>[], key: number): ValueTuple<T> => {
    const last = Math.max(0, keyframes.length - 1)
    const position = Scalar.clamp(key, 0, 1) * last
    const weight = position % 1
    const start = position >> 0
    const end = Scalar.clamp(start + 1, 0, last)

    const a = keyframes.at(start)
    const b = keyframes.at(end)
    if (!a || !b) throw new Error('Missing keyframe data')

    return [a.value, b.value, weight]
}

/**
 * Finds nearest pair of keyframes for the given key and measures blending weight between them.
 * - Keyframes are expected to be in ascending order.
 * - If keyframes are empty NaN is returned for weight.
 * - When key preceeds first keyframe the result will have weight of 0 and contain first keyframe as both start and end.
 * - When key is ahead of last keyframe the result will have weight of 0 and contain last keyframe as both start and end.
 * @param keyframes (Preferrably) sorted keyframes
 * @param key Search key
 * @returns Value tuple
 */
export const at = <T>(keyframes: Iterable<Keyframe<T>>, key: number): ValueTuple<T> => {
    /** Keyframe ahead of current position. */
    let ahead

    /** Keyframe before of current position. */
    let before

    /** Key delta between next and last. */
    let delta = Infinity

    // Loop over keyframes until given key precedes next keyframe.
    for (ahead of keyframes) {
        delta = before ? ahead.key - before.key : Infinity

        // Stops when next keyframe is ahead of key while delta check skips out of order and overlapping keyframes.
        if (key <= ahead.key && delta > 0) break

        before = ahead

        // Reset delta for key after last keyframe.
        delta = Infinity
    }

    // Key is either invalid or there were no keyframes.
    if (!ahead) throw new Error('Missing keyframe data')

    // Current won't be available if key precedes first keyframe.
    before ??= ahead

    // Mix keyframes by weight of transition between two keyframes.
    return [before.value, ahead.value, Math.abs(Scalar.clamp((key - before.key) / delta, 0, 1))]
}

/**
 * Reverses keyframes in array.
 * @param keyframes
 * @returns
 */
export const reverse = <T>(keyframes: Keyframe<T>[]): Keyframe<T>[] => {
    const keys = keyframes.map(({ key }) => key).reverse()
    return keyframes.map(({ value }, index) => ({ key: keys[index]!, value }))
}

/**
 * Condenses keyframes to [0, 1] key range.
 * @param keyframes
 */
export const normalize = <T>(keyframes: Keyframe<T>[]): Keyframe<T>[] => {
    const [min] = range(keyframes)
    const total = duration(keyframes)

    return keyframes.map(({ key, value }) => ({ key: (key - min) / total, value }))
}
