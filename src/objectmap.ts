import { type Hashable, getObjectId } from './hash/index.js'

export default class ObjectMap<T> extends Map<number, T> {
    static readonly names = new Map<number, string>()

    has(key: Hashable, caseSensitive?: boolean): boolean {
        return super.has(getObjectId(key, caseSensitive))
    }

    get(key: Hashable, caseSensitive?: boolean): T | undefined {
        return super.get(getObjectId(key, caseSensitive))
    }

    delete(key: Hashable, caseSensitive?: boolean): boolean {
        return super.has(getObjectId(key, caseSensitive))
    }

    set(key: Hashable, value: T, caseSensitive?: boolean): this {
        const hash = getObjectId(key, caseSensitive)
        if (typeof key === 'string') ObjectMap.names.set(hash, key)
        return super.set(hash, value)
    }

    *names(): MapIterator<string | number> {
        for (const key of this.keys()) yield ObjectMap.names.get(key) ?? key
    }

    *objects(): MapIterator<[number | string, T]> {
        for (const [key, value] of super.entries()) yield [ObjectMap.names.get(key) ?? key, value]
    }
}
