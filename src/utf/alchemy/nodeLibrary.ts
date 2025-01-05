import { type BufferReader, type BufferWriter } from '../../buffer/types.js'
import { getResourceId, type Hashable } from '../../hash/index.js'
import { type ReadableDirectory, type ReadsDirectory, type WritableDirectory, type WritesDirectory } from '../types.js'
import Node from './node.js'

/** Node library. */
export default class NodeLibrary extends Set<Node> implements ReadsDirectory, WritesDirectory {
    readonly filename = 'AlchemyNodeLibrary'
    readonly kind = 'directory'

    constructor(public version = 1.1) {
        super()
    }

    get byteLength() {
        return (
            Float32Array.BYTES_PER_ELEMENT + // Version.
            Uint32Array.BYTES_PER_ELEMENT + // Node count.
            Array.from(this).reduce((length, node) => length + node.byteLength, 0) // Nodes.
        )
    }

    /**
     * Find all nodes matching Node_Name value.
     * @param name
     */
    *get(name: Hashable) {
        name = getResourceId(name, true)

        for (const node of this) if (getResourceId(node.name, true) === name) yield node
    }

    read(parent: ReadableDirectory) {
        const file = parent.getFile(this.filename)
        if (!file) throw new RangeError()

        const view = file.view

        this.version = view.readFloat32()

        for (let i = 0, count = view.readUint32(); i < count; i++) {
            const node = new Node()
            node.read(view)
            this.add(node)
        }
    }

    write(parent: WritableDirectory) {
        const file = parent.setFile(this.filename)
        file.byteLength = this.byteLength

        const view = file.view

        view.writeFloat32(this.version)
        view.writeUint32(this.size)
        
        for (const node of this) node.write(view as BufferReader & BufferWriter)
    }

    toJSON() {
        return {
            kind: 'alchemy-node-library',
            nodes: [...this.values()]
        }
    }
}
