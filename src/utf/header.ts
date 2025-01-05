import { type BufferReader, type BufferWriter } from '../buffer/types.js'
import { fromFiletime64, toFiletime64 } from './date.js'
import Entry from './entry.js'

/**
 * UTF header.
 */
export default class Header {
    static readonly Size = 0x38

    /** Header size. 56 bytes. */
    readonly byteLength = Header.Size

    /** FourCC signature: "UTF ". */
    readonly signature = 0x20465455

    /** Version is always 0x101. */
    readonly version = 0x101

    /** Offset to tree block where entries are listed. */
    treeOffset = 0

    /** Size of tree (in bytes). */
    treeSize = 0

    /** Root entry offset relative to treeOffset. */
    entryOffset = 0

    /** Entry size. Always 44 bytes. Freelancer will crash otherwise. */
    readonly entrySize = Entry.Size

    /** Offset to dictionary block. Entry names are ASCII strings with NUL terminator. */
    namesOffset = 0

    /** Size allocated to dictionary (in bytes). */
    namesSizeAllocated = 0

    /** Size of used space by dictionary (in bytes). Must be equal or less than namesSizeAllocated. */
    namesSizeUsed = 0

    /** Offset to entry file data. */
    dataOffset = 0

    /** Offset to extra data. */
    unusedOffset = 0

    /** Size of extra data. */
    unusedSize = 0

    /** Widows 64-bit FILETIME. */
    filetime = new Date()

    read(view: BufferReader): void {
        if (view.readUint32() !== this.signature) throw new Error('Invalid UTF signature')
        if (view.readUint32() !== this.version) throw new Error('Invalid UTF version')

        this.treeOffset = view.readUint32()
        this.treeSize = view.readUint32()
        this.entryOffset = view.readUint32()

        if (view.readUint32() !== this.entrySize) throw new RangeError('Invalid UTF entry size')

        this.namesOffset = view.readUint32()
        this.namesSizeAllocated = view.readUint32()
        this.namesSizeUsed = view.readUint32()
        this.dataOffset = view.readUint32()
        this.unusedOffset = view.readUint32()
        this.unusedSize = view.readUint32()

        this.filetime = fromFiletime64(view.readBigUint64())
    }

    write(view: BufferWriter): void {
        view.writeUint32(this.signature)
        view.writeUint32(this.version)
        view.writeUint32(this.treeOffset)
        view.writeUint32(this.treeSize)
        view.writeUint32(this.entryOffset)
        view.writeUint32(this.entrySize)
        view.writeUint32(this.namesOffset)
        view.writeUint32(this.namesSizeAllocated)
        view.writeUint32(this.namesSizeUsed)
        view.writeUint32(this.dataOffset)
        view.writeUint32(this.unusedOffset)
        view.writeUint32(this.unusedSize)

        view.writeBigUint64(toFiletime64(this.filetime))
    }
}
