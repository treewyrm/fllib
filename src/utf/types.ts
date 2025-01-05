import { concat } from '../buffer/index.js'
import { type BufferReader, type BufferWriter, type Readable, type Writable } from '../buffer/types.js'
import { type Hashable } from '../hash/index.js'

export type ReadsBuffer<T extends object> = (view: BufferReader, value: T) => void

export type WritesBuffer<T extends object> = (view: BufferWriter, value: T) => void

export interface FileObject {
    /** Object kind discrimiation tag. */
    readonly kind: 'file'

    /** Serialized file byte length. */
    readonly byteLength: number

    /** Default file name. */
    readonly filename?: string
}

export type ReadsFile = FileObject & Readable

export type WritesFile = FileObject & Writable

export interface DirectoryObject {
    /** Object kind discrimination tag. */
    readonly kind: 'directory'

    /** Default directory name. */
    readonly filename?: string
}

/** Object reads data from directory. */
export interface ReadsDirectory extends DirectoryObject {
    read(parent: ReadableDirectory): void
}

/** Object writes data into directory. */
export interface WritesDirectory extends DirectoryObject {
    write(parent: WritableDirectory): void
}

export type ReadableEntry = ReadableDirectory | ReadableFile

/** Directory which allows only read access. */
export interface ReadableDirectory extends Iterable<[number, ReadableEntry]> {
    /** Number of entries in directory. */
    readonly size: number

    /**
     * Reads directory object.
     * @param value Directory object
     * @param name Directory name
     */
    read<T extends ReadsDirectory>(value: T, name?: Hashable): T | undefined
    
    /**
     * Reads file object.
     * @param value File object
     * @param name File name
     * @param repeat 
     */
    read<T extends ReadsFile>(value: T, name?: Hashable, repeat?: boolean): T | undefined

    /** Lists subdirectories. */
    directories(): Generator<[string, ReadableDirectory], undefined, void>

    /** Lists files. */
    files(): Generator<[string, ReadableFile], undefined, void>

    /**
     * Finds directory by name.
     * @param name 
     */
    getDirectory(name: Hashable): ReadableDirectory | undefined

    /**
     * Finds file by name.
     * @param name 
     */
    getFile(name: Hashable): ReadableFile | undefined

    /**
     * Reads file object with a reader function.
     * @param name 
     * @param reader 
     * @param value 
     */
    readFile<T extends object>(name: Hashable, reader: ReadsBuffer<T>, value: T): void
}

export type WritableEntry = WritableDirectory | WritableFile

/** Directory which allows only write access. */
export interface WritableDirectory extends Iterable<[number, WritableEntry]> {
    /** Number of entries in directory. */
    readonly size: number

    /**
     * Deletes entry by name.
     * @param name 
     */
    delete(name: Hashable): boolean

    // setFile(name: string, byteLength?: number): WritableFile
    // setFile(name: string, text?: string): WritableFile
    // setFile(name: string, buffer?: ArrayBuffer): WritableFile
    
    /**
     * Creates new or returns existing file by name.
     * @param name 
     */
    setFile(name: string, data?: number | string | ArrayBuffer): WritableFile

    /**
     * Creates new or returns existing directory by name.
     * @param name 
     */
    setDirectory(name: string): WritableDirectory

    writeFile<T extends object>(name: string, writer: WritesBuffer<T>, value: T, byteLength: number): void

    set(name: string, entry: WritableEntry): this

    /**
     * Writes directory object.
     * @param value Directory object
     * @param name Directory name
     */
    write<T extends WritesDirectory>(value: T, name?: string): WritableDirectory

    /**
     * Writes file object.
     * @param value File object
     * @param name File name
     * @param append Append buffer to existing file
     */
    write<T extends WritesFile>(value: T, name?: string, append?: boolean): WritableFile

    /** Push entries into directory. */
    adopt(...entries: [string, WritableEntry][]): this
}

export type ReadNext<T> = (index: number, byteOffset: number, byteRemain: number) => T | null

export interface ReadableFile {
    /** File size. */
    readonly byteLength: number

    /** File buffer. */
    readonly data: ArrayBuffer

    readonly view: BufferReader

    /** Reads sequence of readable objects. */
    read<T extends Readable>(next: ReadNext<T>): Generator<T, void, void>

    /** Reads sequence of signed integers. */
    readIntegers(): Generator<number, void, void>

    /** Reads sequence of 32-bit float point numbers. */
    readFloats(): Generator<number, void, void>

    /** Reads sequence of NUL-terminated strings. */
    readStrings(): Generator<string, void, void>
}

export interface WritableFile {
    /** File size. */
    byteLength: number

    /** File buffer. */
    data: ArrayBuffer

    view: BufferWriter

    push(...chunks: Parameters<typeof concat>): void
    
    /** Writes sequence of 32-bit signed integers. */
    writeIntegers(...values: number[]): void

    /** Writes sequence of 32-bit float point numbers. */
    writeFloats(...values: number[]): void

    /** Writes sequence of NUL-terminated strings. */
    writeStrings(...values: string[]): void
}

/** Known directory names. */
export type DirectoryName = 
    | 'Hardpoints'
    | 'Fixed'
    | 'Revolute'
    | 'Prismatic'
    | 'Cmpnd'
    | 'Root'
    | 'Part_'
    | 'Cons'
    | 'VMeshLibrary'
    | 'VMeshPart'
    | 'VMeshWire'
    | 'MultiLevel'
    | 'Level'
    | 'ALEffectLib'
    | 'AlchemyNodeLibrary'
    | 'Material library'
    | 'Texture library'
    | 'MaterialAnim'
    | string & {}

export type FileName = 
    | 'Fix'
    | 'Rev'
    | 'Pris'
    | 'Cyl'
    | 'Sphere'
    | 'Loose'
    | 'VMeshData'
    | 'VMeshRef'
    | 'VWireData'
    | 'Switch2'
    | 'Position'
    | 'Orientation'
    | 'Axis'
    | 'Min'
    | 'Max'
    | 'ALEffectLib'
    | 'AlchemyNodeLibrary'
    | 'Type'
    | 'Dc'
    | 'Dt_name'
    | 'Dt_flags'
    | 'Oc'
    | 'Ec'
    | 'Et_name'
    | 'Et_flags'
    | 'Bt_name'
    | 'Bt_flags'
    | 'Nt_name'
    | 'Nt_flags'
    | 'Frame count'
    | 'Frame rects'
    | 'FPS'
    | 'MIPS'
    | 'MIP0'
    | 'CUBE'
    | 'Exporter version'
    | string & {}