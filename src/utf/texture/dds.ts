import { type Resource } from '../library.js'
import { type ReadableDirectory, type WritableDirectory } from '../types.js'

export default class DirectDrawSurfaceTexture implements Resource {
    readonly kind = 'directory'

    data = new Uint8Array()

    get byteLength(): number {
        return 0
    }

    static test(parent: ReadableDirectory): boolean {
        return !!(parent.getFile('MIPS') || parent.getFile('CUBE'))
    }

    read(directory: ReadableDirectory): void {
        const cube = directory.getFile('CUBE')
        if (cube) {
            this.data = new Uint8Array(cube.data.slice())
            return
        }

        const mips = directory.getFile('MIPS')
        if (mips) {
            this.data = new Uint8Array(mips.data.slice())
            return
        }

        throw new Error('Missing CUBE or MIPS file in texture directory.')
    }

    write(directory: WritableDirectory): void {
        const mips = directory.setFile('MIPS')
        mips.data = this.data.buffer
    }
}
