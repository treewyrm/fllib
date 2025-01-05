import { getResourceId } from '../../hash/index.js'
import ResourceMap from '../../resourcemap.js'
import { recurse, toHex } from '../../utility.js'
import Node from './node.js'

type NodeInstanceTuple = [child: NodeInstance, parent?: NodeInstance]

let index = 0

/**
 * Node instance is an entry in effect referencing nodes in node library.
 */
export default class NodeInstance extends Set<NodeInstance> {
    /** Known to be used for dummy instance. Original string source is unknown. */
    static readonly DefaultId = 0xee223b51

    static fromNode(node: Node) {
        return new this(undefined, getResourceId(node.name, true))
    }

    constructor(
        /** Instance id. */
        public id = toHex(index++),

        /** Node id in node library. */
        public nodeId = NodeInstance.DefaultId,

        /** Control flags. */
        public flags = 0,

        /** Sorting index. */
        public sort = 0,

        /** Target instances. */
        public targets = new Set<NodeInstance>(),

        ...args: ConstructorParameters<typeof Set<NodeInstance>>
    ) {
        super(...args)
    }

    get byteLength(): number {
        return (
            Uint32Array.BYTES_PER_ELEMENT + // Flags.
            Uint32Array.BYTES_PER_ELEMENT + // Node id.
            Uint32Array.BYTES_PER_ELEMENT + // Parent index.
            Uint32Array.BYTES_PER_ELEMENT + // Child index.
            [...this].reduce((total, { byteLength }) => total + byteLength, 0) +
            this.targets.size * 2 * Uint32Array.BYTES_PER_ELEMENT
        )
    }

    list() {
        return recurse<NodeInstanceTuple>([[this]], ([parent]) => [...parent].map((child) => [child, parent]))
    }

    toJSON() {
        const targets = [...this.targets.values()].map((target) => target.id)
        const children = [...this.values()]

        return {
            id: this.id,
            node: ResourceMap.names.get(this.nodeId) ?? this.nodeId,
            flags: this.flags,
            sort: this.sort,
            targets: targets.length > 0 ? targets : undefined,
            children: children.length > 0 ? children : undefined,
        }
    }
}
