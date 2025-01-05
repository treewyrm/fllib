/** Sets bit at index position. */
export const set = (a: number, i: number): number => a | (1 << i)

/** Unsets bit at index position. */
export const unset = (a: number, i: number): number => a & ~(1 << i)

/** Flips bit at index position. */
export const toggle = (a: number, i: number): number => a ^ (1 << i)

/** Tests bit at position. */
export const test = (a: number, i: number): boolean => (a & (1 << i)) !== 0

export const MaxFloat = 1.0e36

// Euler angles to radian multiplier.
export const eulerToRadian = Math.PI / 180

// Radian to euler angles multiplier.
export const radianToEuler = 180 / Math.PI

export const SQRT6 = Math.sqrt(6)

/**
 * Tests if first number is close to second number within margin of error.
 * @param a First value
 * @param b Second value
 * @param epsilon Margin of error
 * @returns
 */
export const equal = (a: number, b: number, epsilon = 0.0001): boolean =>
    Math.abs(a - b) <= epsilon * Math.max(1, Math.abs(a), Math.abs(b))

/**
 * Remaps value from range A to range B (linear).
 * @param a Input value
 * @param aMin Range A start
 * @param aMax Range A end
 * @param bMin Range B start
 * @param bMax Range B end
 * @returns
 */
export const remap = (a: number, aMin: number, aMax: number, bMin: number, bMax: number) =>
    bMin + ((a - aMin) / (aMax - aMin)) * (bMax - bMin)

/**
 * Remaps value from linear range to logarithmic range.
 * @param a
 * @param aMin Linear range start
 * @param aMax Linear range end
 * @param bMin Logarithmic range start
 * @param bMax Logarithmic range end
 * @returns
 */
export const remapLog = (a: number, aMin = 0, aMax = 1, bMin = 0.5, bMax = 2) =>
    Math.exp(remap(a, aMin, aMax, Math.log(bMin), Math.log(bMax)))

/**
 * Remaps value from logarithmic range to linear range.
 * @param a
 * @param aMin Logarithmic range start
 * @param aMax Logarithmic range end
 * @param bMin Linear range start
 * @param bMax Linear range end
 * @returns
 */
export const remapLogInverse = (a: number, aMin = 0.5, aMax = 2, bMin = 0, bMax = 1) =>
    remap(Math.log(a), Math.log(aMin), Math.log(aMax), bMin, bMax)

/**
 * Checks if integer is power of two.
 * @param value
 * @returns
 */
export const isPow2 = (a: number): boolean => !!a && !(a & (a - 1))

/**
 * Wraps integer value around max (which must be power of two)
 * @param a
 * @param max
 * @returns
 */
export const wrap2 = (a: number, max: number) => (a &= max - 1)

/**
 * Converts euler angle to radian.
 * @param a Input angle (euler)
 * @returns Radian value
 */
export const radians = (a: number): number => a * eulerToRadian

/**
 * Converts radian angle to euler.
 * @param a Input angle (radian)
 * @returns Euler value
 */
export const angles = (a: number): number => a * radianToEuler

/**
 * Modulo operator.
 * @param a Left value
 * @param b Right value
 * @returns
 */
export const mod = (a: number, b: number): number => ((a % b) + b) % b

/**
 * Like modulo by 1 but negative integer values return 0.
 * @param a Input value
 * @returns Value between 0 and 1
 */
export const repeat = (a: number): number => (a > 0 ? 1 + Math.floor(-a) + a : a - Math.floor(a))

/**
 * Like modulo by 1 but every other is reversed.
 * @param a Input value
 * @returns Value between 0 and 1
 */
export const mirror = (a: number): number => 1 - Math.abs(mod(a, 2) - 1)

/**
 * Generate random float point number between minimum and maximum inclusive.
 * @param min Minimum value (default: -1)
 * @param max Maximum value (default: 1)
 */
export const random = (min = -1, max = 1): number => Math.floor(Math.random() * (max - min + 1)) + min

/**
 * Tests if value is between minimum and maximum.
 * @param a Input value
 * @param min Minimum value
 * @param max Maximum value
 */
export const between = (a: number, min = 0, max = 1): boolean => a > min && a < max

/**
 * Clamps value between min and max values.
 * @param a Input value
 * @param min Minimum value (default: -Infinity)
 * @param max Maximum value (default: Infinity)
 */
export const clamp = (a: number, min = -Infinity, max = Infinity): number => (a < min ? min : a > max ? max : a)

/**
 * Saw wave function (periodic, discontinuous).
 * Returns value if period is zero.
 * @param v Input value
 * @param a Wave amplitude (default: 1)
 * @param p Function period (default: 1)
 */
export const saw = (v: number, a = 1, p = 1): number => (p > 0 ? (a / p) * mod(v, p) : v)

/**
 * Triangle wave function (periodic, continuous).
 * Returns value if period is zero.
 * @param v Input value
 * @param a Wave amplitude (default: 1)
 * @param p Function period (default: 1)
 */
export const triangle = (v: number, a = 1, p = 1): number =>
    p > 0 ? (a / p) * (Math.abs(p) - Math.abs(mod(v, 2 * p) - p)) : v

/**
 * Square wave function (periodic, discontinuous).
 * Returns value if period is zero.
 * @param v Input value
 * @param a Wave amplitude (default: 1)
 * @param p Function period (default: 1)
 */
export const square = (v: number, a = 1, p = 1): number => (p > 0 ? (mod(v, 2 * p) < p ? 0 : a) : v)

/**
 * Calculate cubic hermine spline
 * @param t Time
 * @param a Start position
 * @param u Start velocity
 * @param b End position
 * @param v End velocity
 * @returns
 */
export const hermite = (t: number, a: number, u: number, b: number, v: number): number => {
    const t1 = 1 - t
    const t2 = t1 * t1
    const tt = t * t

    return a * ((1 + 2 * t) * t2) + u * (t * t2) + b * (tt * (3 - 2 * t)) + v * (tt * (t - 1))
}

/**
 * Linear interpolation.
 * @param t Time
 * @param a Start value
 * @param b End value
 * @returns
 */
export const linear = (t: number, a: number, b: number): number => a * (1 - t) + b * t

export const smooth = (t: number): number => t * t * (3 - 2 * t)

export const smoother = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10)

export const sine = (t: number): number => 0.5 * (1 - Math.cos(t * Math.PI))

export const sineIn = (t: number): number => 1 - Math.cos(t * 0.5 * Math.PI)

export const sineOut = (t: number): number => Math.sin(t * 0.5 * Math.PI)

export const quad = (t: number): number => t * (t < 0.5 ? 2 * t : 4 - 2 * t - 1)

export const quadIn = (t: number): number => t * t

export const quadOut = (t: number): number => t * (2 - t)

export const cubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1)

export const cubicIn = (t: number): number => t * t * t

export const cubicOut = (t: number): number => --t * t * t + 1

export const step = (t: number): number => Math.round(t)

export const stepIn = (t: number): number => Math.floor(t)

export const stepOut = (t: number): number => Math.ceil(t)
