import { cubicIn, cubicOut, cubic, step } from '../../math/scalar.js'

export enum EasingType {
    None,
    Linear,
    EaseIn,
    EaseOut,
    EaseBoth,
    Step,
}

export const getEasing = (type?: EasingType) => {
    switch (type) {
        case EasingType.EaseIn:
            return cubicIn
        case EasingType.EaseOut:
            return cubicOut
        case EasingType.EaseBoth:
            return cubic
        case EasingType.Step:
            return step
        default:
            return undefined
    }
}

export const easeMap = new Map<EasingType, (t: number) => number>([
    [EasingType.EaseIn, cubicIn],
    [EasingType.EaseOut, cubicOut],
    [EasingType.EaseBoth, cubic],
    [EasingType.Step, step],
])

export const ease = (t: number, type = EasingType.Linear) => easeMap.get(type)?.(t) ?? t