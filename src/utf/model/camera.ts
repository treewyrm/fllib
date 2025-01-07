import { type ReadableDirectory, type ReadsDirectory, type WritableDirectory, type WritesDirectory } from '../types.js'

export default class Camera implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'
    readonly filename = 'Camera'

    fovX = 90
    fovY = 0
    zNear = 1
    zFar = 1000

    read(parent: ReadableDirectory): void {
        ;[this.fovX = 90] = parent.getFile('Fovx')?.readFloats() ?? []
        ;[this.fovY = 0] = parent.getFile('Fovy')?.readFloats() ?? []
        ;[this.zNear = 1] = parent.getFile('Znear')?.readFloats() ?? []
        ;[this.zFar = 1000] = parent.getFile('Zfar')?.readFloats() ?? []
    }

    write(parent: WritableDirectory): void {
        parent.setFile('Fovx').writeFloats(this.fovX)
        parent.setFile('Fovy').writeFloats(this.fovY)
        parent.setFile('Znear').writeFloats(this.zNear)
        parent.setFile('Zfar').writeFloats(this.zFar)
    }
}
