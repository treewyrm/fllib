import { BufferReader, BufferWriter } from '../../../buffer/types.js';
import { Matrix, Vector } from '../../../math/index.js';
import { ReadsFile, WritesFile } from '../../types.js';
import { readMatrix, readVector, writeMatrix, writeVector } from '../../utility.js';

export default class BoneToRoot implements ReadsFile, WritesFile {
    readonly kind = 'file'
    readonly filename = 'Bone to root'

    rotation = Matrix.identity()
    translation = Vector.origin()

    get byteLength(): number {
        return Vector.BYTES_PER_ELEMENT + Matrix.BYTES_PER_ELEMENT
    }

    read(view: BufferReader): void {
        this.rotation = readMatrix(view)
        this.translation = readVector(view)
    }

    write(view: BufferWriter): void {
        writeMatrix(view, this.rotation)
        writeVector(view, this.translation)
    }
}