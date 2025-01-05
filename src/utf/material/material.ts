import { Resource } from '../library.js'
import { ReadableDirectory, WritableDirectory } from '../types.js'

/** Default fallback material. */
export default class Material implements Resource {
    readonly kind = 'directory'

    type = ''

    get byteLength(): number {
        return 0
    }

    read(parent: ReadableDirectory): void {
        // throw new Error('Method not implemented.')
    }

    write(parent: WritableDirectory): void {
        parent.setFile('Type').writeStrings(this.type)

        // throw new Error('Method not implemented.')
    }
}
