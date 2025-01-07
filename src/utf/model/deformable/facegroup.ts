import {
    type WritableDirectory,
    type WritesDirectory,
    type ReadableDirectory,
    type ReadsDirectory,
} from '../../types.js'

export default class FaceGroup implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'

    material = ''
    indices: number[] = []
    isTriangleStrip = false

    read(parent: ReadableDirectory): void {
        ;[this.material = ''] = parent.getFile('Material_name')?.readStrings() ?? []

        const triangleStripIndices = parent.getFile('Tristrip_indices')
        if (triangleStripIndices) {
            this.indices = [...triangleStripIndices.readIntegers()]
            this.isTriangleStrip = true
        } else {
            const faceIndices = parent.getFile('Face_indices')
            if (faceIndices) {
                this.indices = [...faceIndices.readIntegers()]
                this.isTriangleStrip = false
            }
        }
    }

    write(parent: WritableDirectory): void {
        parent.setFile('Material_name').writeStrings(this.material)
        parent.setFile(this.isTriangleStrip ? 'Tristrip_indices' : 'Face_indices').writeIntegers(...this.indices)
    }
}
