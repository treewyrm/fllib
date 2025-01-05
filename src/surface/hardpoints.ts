import { type BufferReader, type BufferWriter } from '../buffer/types.js'

/** List of hull ids used for hardpoints. */
export default class Hardpoints extends Set<number> {
    get byteLength(): number {
        return Uint32Array.BYTES_PER_ELEMENT + this.size * Uint32Array.BYTES_PER_ELEMENT
    }

    read(input: BufferReader): void {
        const length = input.readUint32()
        for (let i = 0; i < length; i++) this.add(input.readInt32())
    }

    write(output: BufferWriter): void {
        output.writeUint32(this.size)

        for (const hardpoint of this) output.writeInt32(hardpoint)
    }
}
