import { getByteLength } from '../buffer/utility.js'
import { type ReadableDirectory, type ReadsDirectory, type WritableDirectory, type WritesDirectory } from './types.js'
import ResourceMap from '../resourcemap.js'

export interface Resource extends ReadsDirectory, WritesDirectory {
    readonly byteLength: number

    /** Reads resource from directory. */
    read(directory: ReadableDirectory): void

    /** Writes resource into directory. */
    write(directory: WritableDirectory): void
}

/**
 * Generic resource library. An object representing directory where each subfolder maps to object of some kind.
 */
export default abstract class Library<T extends Resource> extends ResourceMap<T> implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'

    static getDirectoryName(key: string | number) {
        return typeof key === 'string' ? key : `0x${key.toString(16).padStart(8, '0')}`
    }

    /** Total byte length of all resources in library. */
    get byteLength(): number {
        return getByteLength(...this.values())
    }

    /**
     * Creates resource from the folder.
     * @param parent 
     */
    abstract create(parent: ReadableDirectory, name: string): T | null

    /**
     * Reads from library directory.
     * @param parent
     */
    read(parent: ReadableDirectory): void {
        for (const [name, directory] of parent.directories()) {
            const resource = this.create(directory, name)
            if (!resource) continue
                
            resource.read(directory)
            this.set(name, resource)
        }
    }

    /**
     * Writes into library directory.
     * @param parent
     */
    write(parent: WritableDirectory): void {
        for (const [name, resource] of this)
            resource.write(parent.setDirectory(Library.getDirectoryName(name)))
    }
}
