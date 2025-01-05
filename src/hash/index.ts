import crc16 from './crc16.js'
import crc32 from './crc32.js'
import id32 from './id32.js'

/** Hashable value. */
export type Hashable = number | string | ArrayBufferView | ArrayBufferLike

const encoder = new TextEncoder()

/** String encoding buffer. */
const buffer = new Uint8Array(0x1000)

/** Number of written bytes by encoder. */
let written = 0

/** Test if value can be hashed. */
export const isHashable = (value: unknown): value is Hashable =>
    typeof value === 'number' || typeof value === 'string' || ArrayBuffer.isView(value) || value instanceof ArrayBuffer

/**
 * Encode string into temporary buffer for hashing.
 * @param value String value
 * @param caseSensitive Match character case
 * @returns Unsigned 8-bit integer buffer
 */
export const bufferize = (value: string, caseSensitive = false): Uint8Array => (
    ({ written } = encoder.encodeInto(caseSensitive ? value : value.toLowerCase(), buffer)), buffer.subarray(0, written)
)

/**
 * Convert hashables into bytes.
 * @param value Hashable value
 * @param caseSensitive Match character case
 * @returns Unsigned 8-bit integer buffer
 */
const bytes = (value: Exclude<Hashable, number>, caseSensitive = false): Uint8Array => {
    switch (typeof value) {
        case 'string':
            return bufferize(value, caseSensitive)
        case 'object':
            if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
            else if (value instanceof ArrayBuffer) return new Uint8Array(value)
            else if ('nickname' in value && typeof value.nickname === 'string')
                return bufferize(value.nickname, caseSensitive)

        default:
            throw new TypeError('Non-hashable value')
    }
}

export type HashFunction = (value: Hashable, caseSensitive?: boolean) => number

/**
 * Several rules for all methods:
 * - Number value is never hashed and is returned back as:
 *   - Unsigned 16-bit for short id
 *   - Signed 32-bit for resource and object ids
 * - String value is encoded into local buffer (up to 1024 bytes)
 * - If object is a view then hashing is done over view byte range
 */

/**
 * Get short (and very weak) id. Exclusively used for faction nicknames.
 * @param value Hashable value
 * @param caseSensitive Match character case
 * @returns Unsigned 16-bit integer
 */
export const getShortId: HashFunction = (value: Hashable, caseSensitive = false): number =>
    typeof value === 'number' ? value & 0xffff : crc16(bytes(value, caseSensitive))

/**
 * Get asset/resource id (model parts, material and texture references, alchemy nodes).
 * Generally any resource referenced in UTF files.
 * @param value Hashable value
 * @param caseSensitive Match character case
 * @returns Signed 32-bit integer
 */
export const getResourceId: HashFunction = (value: Hashable, caseSensitive = false): number =>
    typeof value === 'number' ? value | 0 : crc32(bytes(value, caseSensitive))

/**
 * Get archetype/object id (system objects, archetypes for ships, solars, equipment, etc).
 * Generally any resource referenced in INI files.
 * @param value Hashable value
 * @param caseSensitive Match character case
 * @returns Signed 32-bit integer
 */
export const getObjectId: HashFunction = (value: Hashable, caseSensitive = false): number =>
    typeof value === 'number' ? value | 0 : id32(bytes(value, caseSensitive))

/**
 * Create search predicate for a given hash function.
 * @param match Match value
 * @param key Object property key
 * @param hash Hash function
 * @param caseSensitive Match character case
 * @returns
 */
export const match = <T>(match: Hashable, key: keyof T, hash: HashFunction = getResourceId, caseSensitive = false) => (
    (match = hash(match)), ({ [key]: id }: T) => isHashable(id) && hash(id, caseSensitive) === match
)

/**
 * Find all objects in iterator with matching key value by hash function.
 * @param iterable Iterable list
 * @param key Object property key
 * @param value Search value
 * @param hash Value hash function
 * @param caseSensitive Match character case
 */
export function* findAll<T>(
    iterable: Iterable<T>,
    key: keyof T,
    value: Hashable,
    hash: HashFunction = getResourceId,
    caseSensitive = false
): Generator<T> {
    value = hash(value)

    for (const entry of iterable) {
        const id = entry[key]
        if (isHashable(id) && hash(id, caseSensitive) === value) yield entry
    }
}

/**
 * Find object in array by key for a given hash function.
 * @param array Array of objects
 * @param key Object property key
 * @param value Search value
 * @param hash Hash function
 * @param caseSensitive Match character case
 * @returns
 */
export const findInArray = <T>(
    array: Array<T>,
    key: keyof T,
    value: Hashable,
    hash = getResourceId,
    caseSensitive = false
) => array.find(match(value, key, hash, caseSensitive))

/**
 * Finds value in map where key is Hashable and matches search.
 * @param map Map of values
 * @param value Search value
 * @param hash Hash function
 * @param caseSensitive Match character case
 * @returns 
 */
export const findInMap = <T>(map: Map<Hashable, T>, value: Hashable, hash = getResourceId, caseSensitive = false): T | undefined => {
    value = hash(value, caseSensitive)
    for (const [key, value] of map) if (hash(key, caseSensitive) === value) return value
    return
}

/**
 * Create resource key (typically `name`) search predicate for `Array.prototype.find`.
 * @param match Match target
 * @param key Object property key
 * @param caseSensitive Match character case
 * @returns
 */
export const matchResourceId = <T>(match: Hashable, key: keyof T, caseSensitive = false) => (
    (match = getResourceId(match)), ({ [key]: id }: T) => isHashable(id) && getResourceId(id, caseSensitive) === match
)

/**
 * Create object key (typically `nickname`) search predicate for `Array.prototype.find`.
 * @param match Match target
 * @param key Object property key
 * @param caseSensitive Match character case
 * @returns
 */
export const matchObjectId = <T>(match: Hashable, key: keyof T, caseSensitive = false) => (
    (match = getObjectId(match)), ({ [key]: id }: T) => isHashable(id) && getObjectId(id, caseSensitive) === match
)

/**
 * Find object matching key value.
 * @param iterable Objects to look into
 * @param key Search key in objects
 * @param value Hashable value
 * @param caseSensitive Match character case
 * @returns
 */
export const findByResourceId = <T>(iterable: Iterable<T>, key: keyof T, value: Hashable, caseSensitive = false) => {
    const resourceId = getResourceId(value, caseSensitive)

    for (const item of iterable) {
        const id = item[key]

        if (isHashable(id) && getResourceId(id, caseSensitive) === resourceId) return item
    }

    return
}
