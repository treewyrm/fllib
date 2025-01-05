import { getObjectId } from '../hash/index.js'
import Property from './property.js'
import { toString } from './value.js'

export default class Section {
    /** Section position in text ini (line number) or binary ini (byte offset). */
    position = 0

    /** Section comment after semicolon delimiter. */
    comment?: string

    constructor(
        public name: string,
        public properties: Property[] = [] // Keep it as array for easier order maintenance.
    ) {}

    find(search: string) {
        search = search.toLowerCase()
        return this.properties.find(({ name }) => name.toLowerCase() === search)
    }

    filter(search: string) {
        search = search.toLowerCase()
        return this.properties.filter(({ name }) => name.toLowerCase() === search)
    }

    get objectId() {
        return getObjectId(this.nickname, false)
    }

    get nickname() {
        return toString(this.find('nickname')?.values.at(0))
    }

    [Symbol.iterator]() {
        return this.properties.values()
    }
}
