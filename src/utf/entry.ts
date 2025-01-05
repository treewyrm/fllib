import { type BufferReader, type BufferWriter } from '../buffer/types.js'
import { fromDOSTimestamp, toDOSTimestamp } from './date.js'

export enum FileAttribute {
    Normal = 0x80,
    Directory = 0x10
}

/**
 * UTF directory or file entry.
 */
export default class Entry {
    static readonly Size = 0x2c

    /** Entry byte length. */
    readonly byteLength = Entry.Size

    /** Offset to next sibling relative to treeOffset. */
    nextOffset = 0

    /** Offset to entry name relative namesOffset. */
    nameOffset = 0

    /** Entry filesystem properties (see: Win32 API dwFileAttributes). */
    fileAttributes = 0

    /** Unused bitmask for filesystem sharing properties. */
    sharingAttributes = 0

    /** Offset to either first child relative to treeOffset or to entry data relative to dataOffset. */
    childOffset = 0

    /** Allocated length in data block for file entry. */
    dataSizeAllocated = 0

    /** Actual used space, must be less or equal to allocated size. */
    dataSizeUsed = 0

    /** Unused. Typically, is the same as used space size. */
    dataSizeUncompressed = 0

    /** DOS file timestamp. */
    createTime = new Date()

    /** Same as above for last access timestamp. */
    accessTime = new Date()

    /** Same as above for last modification timestamp. */
    modifyTime = new Date()

    read(view: BufferReader): void {
        this.nextOffset = view.readUint32()
        this.nameOffset = view.readUint32()
        this.fileAttributes = view.readUint32()
        this.sharingAttributes = view.readUint32()
        this.childOffset = view.readUint32()
        this.dataSizeAllocated = view.readUint32()
        this.dataSizeUsed = view.readUint32()
        this.dataSizeUncompressed = view.readUint32()

        this.createTime = fromDOSTimestamp(view.readUint32())
        this.accessTime = fromDOSTimestamp(view.readUint32())
        this.modifyTime = fromDOSTimestamp(view.readUint32())
    }

    write(view: BufferWriter): void {
        view.writeUint32(this.nextOffset)
        view.writeUint32(this.nameOffset)
        view.writeUint32(this.fileAttributes)
        view.writeUint32(this.sharingAttributes)
        view.writeUint32(this.childOffset)
        view.writeUint32(this.dataSizeAllocated)
        view.writeUint32(this.dataSizeUsed)
        view.writeUint32(this.dataSizeUncompressed)

        view.writeUint32(toDOSTimestamp(this.createTime))
        view.writeUint32(toDOSTimestamp(this.accessTime))
        view.writeUint32(toDOSTimestamp(this.modifyTime))
    }
}
