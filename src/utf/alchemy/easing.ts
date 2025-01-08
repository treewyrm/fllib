import { cubicIn, cubicOut, cubic, step } from '../../math/scalar.js'

export enum Easing {
    None,
    Linear,
    EaseIn,
    EaseOut,
    EaseBoth,
    Step,
}

export const ease = (key: number, easing?: Easing) => {
    switch (easing) {
        case Easing.Linear:
            return key
        case Easing.EaseIn:
            return cubicIn(key)
        case Easing.EaseOut:
            return cubicOut(key)
        case Easing.EaseBoth:
            return cubic(key)
        case Easing.Step:
            return step(key)
        default:
            return 0
    }
}
