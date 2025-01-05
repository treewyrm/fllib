import { clamp } from './scalar.js'

export const normal = (a: number, b: number) => 0.5 * (a + b)

export const screen = (a: number, b: number) => 1 - (1 - a) * (1 - b)

export const overlay = (a: number, b: number) => (a < 0.5 ? 2 * a * b : 1 - 2 * (1 - a) * (1 - b))

export const hardLight = (a: number, b: number) => (b < 0.5 ? 2 * a * b : 1 - 2 * (1 - b) * (1 - a))

export const softLight = (a: number, b: number): number => {
    const c = Math.sqrt(a)
    return b < 0.5 ? 2 * a * b + a * a - 2 * a * a * b : 2 * c * b - c + 2 * a - 2 * a * b
}

export const colorDodge = (a: number, b: number): number => a / (1 - b)

export const colorBurn = (a: number, b: number): number => 1 - (1 - a) / b

export const linearBurn = (a: number, b: number): number => a + b - 1

/** Converts float to 32-bit integer RGBA. */
export const floatToInt32 = (r: number, g: number, b: number, a = 0): number =>
    ((clamp(r) * 0xff) & 0xff) |
    (((clamp(g) * 0xff) & 0xff) << 0x08) |
    (((clamp(b) * 0xff) & 0xff) << 0x10) |
    (((clamp(a) * 0xff) & 0xff) << 0x18)

/** Converts 32-bit integer RGBA to float. */
export const int32toFloat = (a: number): [r: number, g: number, b: number, a: number] => [
    (0xff & a) / 0xff,
    (0xff & (a >> 0x08)) / 0xff,
    (0xff & (a >> 0x10)) / 0xff,
    (0xff & (a >> 0x18)) / 0xff,
]

/** Swaps red and blue channels in 32-bit integer representing RGBA channels. */
export const swapRedBlue = (c: number): number => ((c & 0x0000ff) << 16) | (c & 0x00ff00) | ((c & 0xff0000) >> 16)

/** Expands 16-bit integer (as 565 per RGB) pixel to full 24-bit (888). */
export const expand565to888 = (a: number): [r: number, g: number, b: number] => {
    let r = (a >> 11) & 0x1f
    let g = (a >> 5) & 0x3f
    let b = a & 0x1f

    r = (r << 3) | (r >> 2)
    g = (g << 2) | (g >> 4)
    b = (b << 3) | (b >> 2)

    return [r, g, b]
}

// https://graphics.stanford.edu/~seander/bithacks.html#ZerosOnRightParallel
const getShift = (m: number) => {
    let c = 16

    m = m & -m
    if (m) c--
    if (m & 0x00ff) c -= 8
    if (m & 0x0f0f) c -= 4
    if (m & 0x3333) c -= 2
    if (m & 0x5555) c -= 1
    return c
}

/**
 * Expands 16bpp buffer to 24bpp or 32bpp buffer with custom color masks.
 * @param source Input buffer (16bpp).
 * @param width Image width.
 * @param height Image height.
 * @param r Red bits bitmask.
 * @param g Green bits bitmask.
 * @param b Blue bits bitmask.
 * @param a Alpha bits bitmask (if 0 result will be 24bpp, otherwise 32bpp).
 */
export const expandTo8bpp = (
    source: Uint16Array,
    width: number,
    height: number,
    r: number,
    g: number,
    b: number,
    a = 0
) => {
    if (width * height !== source.length) throw new RangeError('Invalid source array size')

    const result = new Uint8Array(width * height * (a > 0 ? 4 : 3))
    let sR = 0,
        sG = 0,
        sB = 0,
        sA = 0,
        xR = 0,
        xG = 0,
        xB = 0,
        xA = 0

    // Shifts (s0) and color amp multipliers (x0)
    if (r > 0) xR = 0xff / (r >> (sR = getShift(r)))
    if (g > 0) xG = 0xff / (g >> (sG = getShift(g)))
    if (b > 0) xB = 0xff / (b >> (sB = getShift(b)))
    if (a > 0) xA = 0xff / (a >> (sA = getShift(a)))

    // Loop over 16-bit pixels
    for (let s = 0, d = 0, p = 0; s < source.length; s++) {
        p = source[s]!

        result[d++] = (xR * (p & r)) >> sR
        result[d++] = (xG * (p & g)) >> sG
        result[d++] = (xB * (p & b)) >> sB

        if (a > 0) result[d++] = (xA * (p & a)) >> sA
    }

    return result
}

/** Converts RGB to HSL color space. */
export const RGBToHSL = (r: number, g: number, b: number): [h: number, s: number, l: number] => {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) * 0.5

    if (max == min) return [0, 0, l]

    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    let h = 0

    if (max == r) h = (g - b) / d + (d < b ? 6 : 0)
    else if (max == g) h = (b - r) / d + 2
    else if (max == b) h = (r - g) / d + 4

    return [h / 6, s, l]
}

/** Converts decomposed hue to RGB. */
const hueToRGB = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
}

/** Converts HSL to RGB color space. */
export const HSLToRGB = (h: number, s: number, l: number): [r: number, g: number, b: number] => {
    if (s == 0) return [l, l, l]

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    return [hueToRGB(p, q, h + 1 / 3), hueToRGB(p, q, h), hueToRGB(p, q, h - 1 / 3)]
}
