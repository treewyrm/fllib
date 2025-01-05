import { type Hashable, getResourceId } from './hash/index.js'
import { toHex } from './utility.js'

export default class ResourceMap<T> extends Map<number, T> {
    static readonly names = new Map<number, string>()

    has(key: Hashable, caseSensitive?: boolean): boolean {
        return super.has(getResourceId(key, caseSensitive))
    }

    get(key: Hashable, caseSensitive?: boolean): T | undefined {
        return super.get(getResourceId(key, caseSensitive))
    }

    delete(key: Hashable, caseSensitive?: boolean): boolean {
        return super.delete(getResourceId(key, caseSensitive))
    }

    set(key: Hashable, value: T, caseSensitive?: boolean): this {
        const hash = getResourceId(key, caseSensitive)
        if (typeof key === 'string') ResourceMap.names.set(hash, key)
        return super.set(hash, value)
    }

    *names(): MapIterator<string> {
        for (const key of this.keys()) yield ResourceMap.names.get(key) ?? toHex(key)
    }

    *objects(): MapIterator<[string, T]> {
        for (const [key, value] of this.entries()) yield [ResourceMap.names.get(key) ?? toHex(key), value]
    }
}
