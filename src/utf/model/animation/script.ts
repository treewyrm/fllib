import { type Resource } from '../../library.js'
import { type ReadableDirectory, type WritableDirectory } from '../../types.js'
import JointMap from './jointmap.js'
import ObjectMap from './objectmap.js'

export default class Script implements Resource {
    readonly kind = 'directory'

    jointMaps: JointMap[] = []

    objectMaps: ObjectMap[] = []

    rootHeight = 0

    get byteLength() {
        return (
            (this.rootHeight ? Float32Array.BYTES_PER_ELEMENT : 0) +
            this.jointMaps.reduce((total, { byteLength }) => total + byteLength, 0) +
            this.objectMaps.reduce((total, { byteLength }) => total + byteLength, 0)
        )
    }

    read(parent: ReadableDirectory): void {
        let directory
        let index = 0

        ;[this.rootHeight = 0] = parent.getFile('Root height')?.readFloats() ?? []

        // Read joint maps
        while ((directory = parent.getDirectory(`Joint map ${index++}`))) {
            const jointMap = new JointMap()
            jointMap.read(directory)
            this.jointMaps.push(jointMap)
        }

        index = 0

        // Read object maps
        while ((directory = parent.getDirectory(`Object map ${index++}`))) {
            const objectMap = new ObjectMap()
            objectMap.read(directory)
            this.objectMaps.push(objectMap)
        }
    }

    write(parent: WritableDirectory): void {
        if (this.rootHeight) parent.setFile('Root height').writeFloats(this.rootHeight)

        for (const [index, value] of this.objectMaps.entries()) value.write(parent.setDirectory(`Object map ${index}`))
        for (const [index, value] of this.jointMaps.entries()) value.write(parent.setDirectory(`Joint map ${index}`))
    }
}
