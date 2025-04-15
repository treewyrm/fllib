import {
    type ReadableDirectory,
    type WritableDirectory,
    type ReadsDirectory,
    type WritesDirectory,
    type ReadsFile,
    type WritesFile,
    type ReadsBuffer,
    type WritesBuffer,
} from './types.js'
import File, { type FileJSON } from './file.js'
import { type Hashable } from '../hash/index.js'
import { concat, getByteLength } from '../buffer/utility.js'
import { getObjectFilename } from './utility.js'
import ResourceMap from '../resourcemap.js'
import { BufferView, Dictionary } from '../buffer/index.js'
import UTFHeader from './header.js'
import UTFEntry, { FileAttribute } from './entry.js'
import { readString } from '../string.js'

type Entry = Directory | File

/** Convert directory to object. */
export type ReadFromDirectory<T> = (directory: ReadableDirectory) => T

/** Convert object into directory. */
export type WriteIntoDirectory<T, D extends WritableDirectory = WritableDirectory> = (value: T, directory?: D) => D

export type DirectoryJSON = {
    kind: 'directory'
    name: string
    children: (DirectoryJSON | FileJSON)[]
}

/** UTF directory entry. */
export default class Directory extends ResourceMap<Entry> implements ReadableDirectory, WritableDirectory {
    get [Symbol.toStringTag]() {
        return 'Directory'
    }

    /** Total file byte length. */
    get byteLength(): number {
        return getByteLength(...this.values())
    }

    /** Lists all subdirectories in directory. */
    *directories(): Generator<[string, Directory], undefined, void> {
        for (const [name, entry] of this.objects()) if (entry instanceof Directory) yield [name, entry]
    }

    /** List all files in directory. */
    *files(): Generator<[string, File], undefined, void> {
        for (const [name, entry] of this.objects()) if (entry instanceof File) yield [name, entry]
    }

    /**
     * Finds directory.
     * @param name
     * @returns
     */
    getDirectory(name: Hashable): Directory | undefined {
        const entry = this.get(name)
        return entry instanceof Directory ? entry : undefined
    }

    /**
     * Adds new directory or returns existing one.
     * @param name
     * @returns
     */
    setDirectory(name: string): Directory {
        let entry = this.get(name)
        if (!(entry instanceof Directory)) this.set(name, (entry = new Directory()))
        return entry
    }

    /**
     * Finds file.
     * @param name
     * @returns
     */
    getFile(name: Hashable): File | undefined {
        const entry = this.get(name)
        return entry instanceof File ? entry : undefined
    }

    /**
     * Adds new file or returns existing one.
     * @param name
     * @returns
     */
    setFile(name: string, ...data: ConstructorParameters<typeof File>): File {
        let entry = this.get(name)
        if (!(entry instanceof File)) this.set(name, (entry = new File(...data)))
        return entry
    }

    /**
     * Adopts entries recursively into directory.
     * @param entries
     * @returns
     */
    adopt(...entries: [string, Entry][]): this {
        for (const [name, entry] of entries) {
            const child = this.get(name)

            // Adopt children of directory.
            if (child instanceof Directory && entry instanceof Directory && entry.size > 0) {
                child.adopt(...entry.objects())
                continue
            }

            this.set(name, entry)
        }

        return this
    }

    /**
     * Reads file into value with supplied reader function.
     * @param name File name
     * @param reader Reader function
     * @param value Input value
     */
    readFile<T extends object>(name: Hashable, reader: ReadsBuffer<T>, value: T): void {
        const file = this.getFile(name)
        if (file) reader(file.view, value)
    }

    /**
     * Writes value into file with supplied writer function.
     * @param name File name
     * @param writer Writer function
     * @param value Output value
     */
    writeFile<T extends object>(name: string, writer: WritesBuffer<T>, value: T, byteLength: number): void {
        const file = new File(byteLength)
        writer(file.view, value)
        this.set(name, file)
    }

    /**
     * Reads directory or file object.
     * @param value
     * @param name
     * @returns
     */
    read<T extends ReadsDirectory | ReadsFile>(value: T, name: Hashable = getObjectFilename(value)): T | undefined {
        const entry = this.get(name)
        if (!entry) return

        switch (value.kind) {
            case 'directory':
                if (!(entry instanceof Directory)) return
                value.read(entry)
                break
            case 'file':
                if (!(entry instanceof File)) return
                value.read(entry.view)
                break
            default:
                throw new RangeError(`Unknown object kind`)
        }

        return value
    }

    /**
     * Writes object as directory.
     * @param value Directory object
     * @param name Directory name
     */
    write<T extends WritesDirectory>(value: T, name?: string): Directory

    /**
     * Writes object as file.
     * @param value File object
     * @param name File name
     * @param append Append to existing file
     */
    write<T extends WritesFile>(value: T, name?: string, append?: boolean): File

    write<T extends WritesDirectory | WritesFile>(value: T, name = getObjectFilename(value), append = false) {
        let entry

        switch (value.kind) {
            case 'directory':
                // If object has no name then write into this folder.
                if (!name.length) {
                    value.write(this)
                    return entry
                }

                entry = new Directory()
                value.write(entry)
                if (entry.size > 0) this.set(name, entry)

                return entry
            case 'file':
                const { byteLength } = value
                if (!byteLength) return entry

                entry = new File(byteLength)
                value.write(entry.view)

                if (append) {
                    let file = this.getFile(name)
                    if (file) {
                        file.push(entry.data)
                        return file
                    }
                }

                this.set(name, entry)

                return entry
            default:
                throw new RangeError(`Unknown object kind`)
        }
    }

    /**
     *
     * @param buffers Array of buffers to populate with file data buffers and provide byte offset
     * @returns
     */
    toJSON(buffers?: ArrayBuffer[]): DirectoryJSON {
        const children = [...this.objects()].map(([name, entry]) => ({ ...entry.toJSON(buffers), name }))

        return {
            kind: 'directory',
            name: '\\',
            children,
        }
    }

    /**
     * Loads directory from UTF buffer.
     * @param buffer
     * @returns
     */
    static from(buffer: Uint8Array): Directory {
        const view = BufferView.from(buffer)
        const header = new UTFHeader()
        const entry = new UTFEntry()

        header.read(view)

        const { treeOffset, treeSize, entrySize, namesOffset, namesSizeUsed, namesSizeAllocated, dataOffset } = header

        if (treeSize < entrySize) throw new RangeError('Invalid UTF entries hierarchy size.')
        if (namesSizeUsed > namesSizeAllocated) throw new RangeError('Invalid UTF names dictionary used size.')
        if (treeOffset + treeSize > buffer.byteLength) throw new RangeError('UTF entries hierarchy is out of bounds.')
        if (namesOffset + namesSizeUsed > buffer.byteLength)
            throw new RangeError('UTF names dictionary is out of bounds.')

        /** Names dictionary. */
        const names = buffer.subarray(namesOffset, namesOffset + namesSizeUsed)

        /** Entry queue. */
        const queue: { offset: number; parent?: Directory }[] = [{ offset: 0 }]

        /** Root. */
        let root: Directory | undefined

        // Process UTF tree.
        while (queue.length > 0) {
            const { offset, parent } = queue.shift()!

            // Read entry from tree.
            if (offset > treeSize) throw new RangeError('UTF entry offset is out of bounds.')

            // Move pointer to specified offset.
            view.offset = treeOffset + offset
            entry.read(view)

            const { nextOffset, nameOffset, childOffset, fileAttributes, dataSizeUsed } = entry

            if (nameOffset > names.byteLength) throw new RangeError('UTF name offset is out of bounds.')

            // Get entry name.
            const name = readString(names, nameOffset)

            // Add next sibling to queue (excluding root).
            if (parent && nextOffset > 0) queue.push({ offset: nextOffset, parent })

            switch (true) {
                case (fileAttributes & FileAttribute.Normal) > 0:
                    const start = buffer.byteOffset + dataOffset + childOffset
                    const end = start + dataSizeUsed

                    parent?.set(name, new File(buffer.buffer.slice(start, end)))

                    break
                case (fileAttributes & FileAttribute.Directory) > 0:
                    const directory = new this()

                    // Attach to parent or set root.
                    parent ? parent.set(name, directory) : (root ??= directory)

                    // Directory has a child.
                    if (childOffset > 0) queue.push({ offset: childOffset, parent: directory })

                    break
                default:
                    continue
            }
        }

        if (!root) throw new Error('Missing root entry in UTF')
        return root
    }

    /**
     * Serializes directory hierarchy into buffer.
     * @returns
     */
    toBuffer(): Uint8Array {
        const header = new UTFHeader()

        /** Entries list. */
        const entries: UTFEntry[] = []

        /** Entry names. */
        const dictionary = new Dictionary()

        /** File data chunks. */
        const chunks: ArrayBuffer[] = []

        /** Accumulated data size. */
        let dataSize = 0

        // Place empty string first. Used to indicate deleted entries.
        dictionary.push('')

        /** Queue of entries to process hierarchy. */
        const queue: {
            name: string
            target: Directory | File
            entry: UTFEntry
            parent?: UTFEntry
            previous?: UTFEntry
        }[] = [{ name: '\\', target: this, entry: new UTFEntry() }]

        // Process entry queue.
        while (queue.length > 0) {
            const { name, target, entry, parent, previous } = queue.shift()!

            // Skip entries that have no name.
            if (!name.length) continue
            ;[entry.nameOffset] = dictionary.push(name)

            // Add file entry data into queue.
            switch (true) {
                case target instanceof File:
                    entry.fileAttributes |= FileAttribute.Normal

                    const { data } = target
                    if (!data) break

                    entry.childOffset = dataSize
                    entry.dataSizeUncompressed = entry.dataSizeUsed = data.byteLength
                    entry.dataSizeAllocated = data.byteLength

                    dataSize += data.byteLength
                    chunks.push(data)

                    break
                case target instanceof Directory:
                    entry.fileAttributes |= FileAttribute.Directory

                    let last

                    // First child is childOffset and subsequent children are siblings.
                    for (const [name, child] of target.objects())
                        last
                            ? queue.push({ name, target: child, previous: last, entry: (last = new UTFEntry()) })
                            : queue.unshift({ name, target: child, entry: (last = new UTFEntry()), parent: entry })

                    break
            }

            // Update parent entry to first child offset.
            if (parent) parent.childOffset = header.treeSize

            // Update previous entry next offset to current location.
            if (previous) previous.nextOffset = header.treeSize

            header.treeSize += header.entrySize
            entries.push(entry)
        }

        // Update header with accumulated sizes.
        header.treeOffset = header.byteLength
        header.namesOffset = header.treeOffset + header.treeSize
        header.namesSizeAllocated = header.namesSizeUsed = dictionary.byteLength
        header.dataOffset = header.namesOffset + header.namesSizeAllocated

        // Header and tree buffer.
        const view = BufferView.from(header.byteLength + header.treeSize)

        // Write header.
        header.write(view)

        // Write tree.
        for (const entry of entries) entry.write(view)

        return concat(view, ...dictionary.chunks, ...chunks)
    }
}
