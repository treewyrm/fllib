// TODO: Fix DOS date conversion, results are incorrect.

/** Convert Date object into DOS timestamp. */
export const toDOSTimestamp = (value: Date): number =>
    ((value.getSeconds() * 0.5) & 0x1f) +
    ((value.getMinutes() & 0x3f) << 5) +
    ((value.getHours() & 0x1f) << 11) +
    ((value.getDate() & 0x1f) << 16) +
    ((value.getMonth() & 0xf) << 21) +
    (((value.getFullYear() - 1980) & 0x7f) << 25)

/** Convert DOS timestamp into Date object. */
export const fromDOSTimestamp = (value: number): Date =>
    new Date(
        ((value >> 25) & 0x7f) + 1980, // Year
        (value >> 21) & 0xf, // Month
        (value >> 16) & 0x1f, // Day
        (value >> 11) & 0x1f, // Hours
        (value >> 5) & 0x3f, // Minutes
        (value & 0x1f) * 2 // Seconds
    )

/** Convert Date object into 64-bit FILETIME. */
export const toFiletime64 = (value: Date): bigint => BigInt(value.getTime()) * 10000n + 11644473600000n

/** Convert 64-bit FILETIME into Date object. */
export const fromFiletime64 = (value: bigint): Date => new Date(Number(value / 10000n - 11644473600000n))
