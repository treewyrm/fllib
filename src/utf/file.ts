import { type Readable, type Writable } from '../buffer/types.js'
import { type ReadableFile, type ReadNext, type WritableFile } from './types.js'
import { concat, readBuffers, writeBuffers } from '../buffer/utility.js'
import BufferView from '../buffer/view.js'

export type FileJSON = {
    kind: 'file'
    name: string
    byteLength: number
    byteOffset?: number
}

/** UTF file entry. */
export default class File implements ReadableFile, WritableFile {
    /** File data. */
    data = new ArrayBuffer(0)

    get [Symbol.toStringTag]() {
        return 'File'
    }
    
    /**
     * Constructor
     * @param data 
     */
    constructor(
        /** File data. */
        data?: number | string | ArrayBuffer
    ) {
        if (typeof data === 'number') this.data = new ArrayBuffer(data)
        else if (typeof data == 'string') this.writeStrings(data)
        else if (data instanceof ArrayBuffer) this.data = data
    }

    /** Creates buffer view over file data. */
    get view(): BufferView {
        return new BufferView(this.data)
    }

    /** Copies buffer from view into file. */
    set view(value) {
        const { buffer, byteOffset, byteLength } = value
        this.data = buffer.slice(byteOffset, byteOffset + byteLength)
    }

    /** Returns file data byte length. */
    get byteLength(): number {
        return this.data.byteLength
    }

    /** Resets file data to new byte length. Invalidates all existing views on file data. */
    set byteLength(value: number) {
        if (value < this.data.byteLength)
            this.data.slice(0, value) // Reduce file size.
        else if (value > this.data.byteLength)
            this.data = concat(this.data, new ArrayBuffer(value - this.data.byteLength)).buffer // Extends file size.
    }

    /**
     * Append buffers/views to file data.
     * @param chunks
     */
    push(...chunks: Parameters<typeof concat>): this {
        this.data = concat(this.data, ...chunks)
        return this
    }

    /**
     * Reads data as a sequence objects.
     * @param next
     */
    *read<T extends Readable>(next: ReadNext<T>): Generator<T> {
        yield* readBuffers(this.view, next)
    }

    /**
     * Writes sequence of objects into data.
     * @param values
     */
    write(...values: Writable[]): this {
        this.data = concat(...writeBuffers(values))
        return this
    }

    /** Interpret data as sequence of signed integers (narrowing down to 8 bit by remaining bytes). */
    *readIntegers(): Generator<number> {
        const { view } = this
        while (view.byteRemain)
            yield view.byteRemain >= Int32Array.BYTES_PER_ELEMENT
                ? view.readInt32()
                : view.byteRemain >= Int16Array.BYTES_PER_ELEMENT
                  ? view.readInt16()
                  : view.readInt8()
    }

    readInteger(): number | undefined {
        const [value] = this.readIntegers()
        return value
    }

    /**
     * Writes sequence of 32-bit integers into file.
     * Overrides existing data.
     * @param values
     * @returns
     */
    writeIntegers(...values: number[]): this {
        const view = BufferView.from(Int32Array.BYTES_PER_ELEMENT * values.length)
        for (const value of values) view.writeInt32(value)
        this.data = view.buffer

        return this
    }

    /** Reads data as sequence of float numbers. */
    *readFloats(): Generator<number> {
        const { view } = this
        while (view.byteRemain >= Float32Array.BYTES_PER_ELEMENT) yield view.readFloat32()
    }

    readFloat(): number | undefined {
        const [value] = this.readFloats()
        return value
    }

    /**
     * Writes float numbers into file.
     * Overrides existing data.
     * @param values
     * @returns
     */
    writeFloats(...values: number[]): this {
        const view = BufferView.from(Float32Array.BYTES_PER_ELEMENT * values.length)
        for (const value of values) view.writeFloat32(value)
        this.data = view.buffer

        return this
    }

    /** Reads file data as sequence of NUL-terminated strings. */
    *readStrings(): Generator<string> {
        const { view } = this
        while (view.byteRemain) yield view.readZString()
    }

    readString(): string | undefined {
        const [value] = this.readStrings()
        return value
    }

    /**
     * Writes strings into file.
     * @param values
     * @returns
     */
    writeStrings(...values: string[]): this {
        this.data = concat(...values.map((value) => BufferView.from(value + '\0'))).buffer

        return this
    }

    toJSON(buffers?: ArrayBuffer[]): FileJSON {
        const { byteLength } = this

        const byteOffset = buffers ? buffers.reduce((total, { byteLength }) => total + byteLength, 0) : undefined

        if (buffers) buffers.push(this.data)

        return {
            kind: 'file',
            name: '',
            byteOffset,
            byteLength,
        }
    }
}
