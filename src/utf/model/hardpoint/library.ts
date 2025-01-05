import Library from '../../library.js'
import { type ReadableDirectory, type WritableDirectory } from '../../types.js'
import Fixed from './fixed.js'
import Revolute from './revolute.js'

export default class HardpointLibrary extends Library<Fixed | Revolute> {
    static readonly types = [Fixed, Revolute] as const

    static createHardpointByType(value: string) {
        value = value.toLowerCase()

        const Hardpoint = this.types.find(({ name }) => name.toLowerCase() === value)
        if (!Hardpoint) throw new RangeError(`Unknown hardpoint type: ${value}`)

        return new Hardpoint()
    }

    readonly filename = 'Hardpoints'

    create(): never {
        throw new Error('Method not implemented.')
    }

    read(parent: ReadableDirectory) {
        for (const [type, directory] of parent.directories()) {
            for (const [name, subdirectory] of directory.directories()) {
                try {
                    const hardpoint = HardpointLibrary.createHardpointByType(type)
                    hardpoint.read(subdirectory)
                    this.set(name, hardpoint)
                } catch (error) {
                    console.warn(error)
                    break
                }
            }
        }
    }

    write(parent: WritableDirectory) {
        for (const [name, hardpoint] of this.objects())
            hardpoint.write(
                parent.setDirectory(hardpoint.constructor.name).setDirectory(Library.getDirectoryName(name))
            )
    }
}
