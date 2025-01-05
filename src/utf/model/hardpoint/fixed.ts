import {
    type ReadsDirectory,
    type WritesDirectory,
    type ReadableDirectory,
    type WritableDirectory,
} from '../../types.js'
import { Matrix, Quaternion, Vector } from '../../../math/index.js'
import { readMatrix, readVector, writeMatrix, writeVector } from '../../utility.js'
import File from '../../file.js'

export default class Fixed implements ReadsDirectory, WritesDirectory {
    get [Symbol.toStringTag]() {
        return 'FixedHardpoint'
    }

    readonly kind = 'directory'
    readonly filename: string = 'Fixed'

    position = Vector.origin()
    orientation = Quaternion.identity()

    get byteLength(): number {
        return Vector.BYTES_PER_ELEMENT + Matrix.BYTES_PER_ELEMENT
    }

    clone(): Fixed {
        const hardpoint = new Fixed()
        hardpoint.copy(this)
        return hardpoint
    }

    copy(value: Fixed): void {
        this.position = Vector.copy(value.position)
        this.orientation = Quaternion.copy(value.orientation)
    }

    read(parent: ReadableDirectory): void {
        const position = parent.getFile('Position')
        if (position) this.position = readVector(position.view)

        const orientation = parent.getFile('Orientation')
        if (orientation) this.orientation = Quaternion.fromMatrix(readMatrix(orientation.view))
    }

    write(parent: WritableDirectory): void {
        const position = new File(Vector.BYTES_PER_ELEMENT)
        parent.set('Position', position)
        writeVector(position.view, this.position)
        
        const orientation = new File(Matrix.BYTES_PER_ELEMENT)
        parent.set('Orientation', orientation)
        writeMatrix(orientation.view, Matrix.fromQuaternion(this.orientation))
    }
}
