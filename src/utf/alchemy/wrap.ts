import { Scalar } from '../../math/index.js'

export enum WrapFlags {
    None = 0,
    BeforeRepeat = 1 << 0,
    BeforeMirror = 1 << 1,
    BeforeClamp = 1 << 2,
    BeforeContinue = 1 << 3,
    AfterRepeat = 1 << 4,
    AfterMirror = 1 << 5,
    AfterClamp = 1 << 6,
    AfterContinue = 1 << 7,
}

/**
 * Wrap key
 * @param key
 * @param min
 * @param max
 * @param flags
 * @returns Key clamped to keyframe range
 */
export function wrap(key: number, min: number, max: number, flags: WrapFlags): [key: number, multiplier: number] {
    let multiplier = 0

    key = Scalar.remap(key, min, max, 0, 1)

    // Multiplier.
    if ((key < 0 && (flags & WrapFlags.BeforeContinue) > 0) || (key > 1 && (flags & WrapFlags.AfterContinue) > 0))
        multiplier = key > 0 ? Math.ceil(key) - 1 : Math.floor(key)

    // Clamp value.
    if ((key < 0 && (flags & WrapFlags.BeforeClamp) > 0) || (key > 1 && (flags & WrapFlags.AfterClamp) > 0))
        key = Scalar.clamp(key, 0, 1)

    // Repeat value.
    if ((key < 0 && (flags & WrapFlags.BeforeRepeat) > 0) || (key > 1 && (flags & WrapFlags.AfterRepeat) > 0))
        key = Scalar.repeat(key)

    // Mirror value.
    if ((key < 0 && (flags & WrapFlags.BeforeMirror) > 0) || (key > 1 && (flags & WrapFlags.AfterMirror) > 0))
        key = Scalar.mirror(key)

    if (!flags && key === 1) key %= 1

    key = Scalar.remap(key, 0, 1, min, max)

    return [key, multiplier]
}
