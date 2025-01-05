/**
 * Converts 16-bit integer (5-6-5) pixel to 24-bit (8-8-8).
 * @param pixel
 */
export const expand565to888 = (pixel: number): [r: number, g: number, b: number] => {
    let r = (pixel >> 11) & 0x1F,
        g = (pixel >> 5)  & 0x3F,
        b = pixel & 0x1f;

    r = (r << 3) | (r >> 2);
    g = (g << 2) | (g >> 4);
    b = (b << 3) | (b >> 2);

    return [r, g, b];
}

/**
 * Expands 16-bit bitmap to 24 or 32-bit bitmap with color masks.
 * @param source Input 16-bit bitmap
 * @param width Image width
 * @param height Image height
 * @param mR Red bits mask
 * @param mG Green bits mask
 * @param mB Blue bits mask
 * @param mA Alpha bits mask
 */
export const expandRGB = (
    source: Uint16Array,
    width: number,
    height: number,
    mR: number,
    mG: number,
    mB: number,
    mA = 0
) => {
    if (width * height !== source.length) throw new RangeError('Invalid source array size')

    const result = new Uint8Array(width * height * (mA > 0 ? 4 : 3))
    let sR = 0,
        sG = 0,
        sB = 0,
        sA = 0,
        xR = 0,
        xG = 0,
        xB = 0,
        xA = 0

    // https://graphics.stanford.edu/~seander/bithacks.html#ZerosOnRightParallel
    function getShift(m: number) {
        let c = 16

        m = m & -m
        if (m) c--
        if (m & 0x00ff) c -= 8
        if (m & 0x0f0f) c -= 4
        if (m & 0x3333) c -= 2
        if (m & 0x5555) c -= 1
        return c
    }

    // Shifts (s0) and color amp multipliers (x0)
    if (mR > 0) xR = 0xff / (mR >> (sR = getShift(mR)))
    if (mG > 0) xG = 0xff / (mG >> (sG = getShift(mG)))
    if (mB > 0) xB = 0xff / (mB >> (sB = getShift(mB)))
    if (mA > 0) xA = 0xff / (mA >> (sA = getShift(mA)))

    // Loop over 16-bit pixels
    for (let s = 0, d = 0, p = 0; s < source.length; s++) {
        p = source[s]!

        result[d++] = (xR * (p & mR)) >> sR
        result[d++] = (xG * (p & mG)) >> sG
        result[d++] = (xB * (p & mB)) >> sB

        if (mA > 0) result[d++] = (xA * (p & mA)) >> sA
    }

    return result
}
