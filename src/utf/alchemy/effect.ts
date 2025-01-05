import { type Readable, type Writable, type BufferReader, type BufferWriter } from '../../buffer/types.js'
import { assemble, flatten, recurse } from '../../utility.js'
import NodeInstance from './nodeInstance.js'

type Entry = {
    flags: number
    nodeId: number
    parentId: number
    childId: number
}

type Pair = {
    sourceId: number
    targetId: number
}

export default class Effect extends Set<NodeInstance> implements Readable, Writable {
    /** Special parentId value indicating no parent node (i.e. world space). */
    static readonly WorldId = 0x8000

    get byteLength(): number {
        return (
            Uint32Array.BYTES_PER_ELEMENT + // Instance count.
            Uint32Array.BYTES_PER_ELEMENT + // Target count.
            [...this].reduce((total, { byteLength }) => total + byteLength, 0)
        )
    }

    /** Get current max sorting value. */
    get maxSort(): number {
        return Math.max(0, ...[...recurse(this, (value) => value)].map(({ sort }) => sort))
    }

    /**
     * Creates new effect with attachment (empty) node instance.
     * @returns
     */
    static withAttachment() {
        return new this([new NodeInstance(undefined, 1)])
    }

    /** Effect attachment element. */
    get attachment(): NodeInstance | undefined {
        for (const instance of this) if (instance.flags > 0) return instance
        return
    }

    read(view: BufferReader): void {
        const entries = new Array<Entry>(view.readInt32())

        // Load entries.
        for (let i = 0; i < entries.length; i++)
            entries[i] = {
                flags: view.readInt32(),
                nodeId: view.readInt32(),
                parentId: view.readInt32(),
                childId: view.readInt32(),
            }

        const pairs = new Array<Pair>(view.readInt32())

        // Load pairs.
        for (let i = 0; i < pairs.length; i++)
            pairs[i] = {
                sourceId: view.readInt32(),
                targetId: view.readInt32(),
            }

        // Expand list of entires into hierarchy of node instances and link
        const instances = assemble<Entry, NodeInstance>(
            entries,

            // Iterate over instance records to create NodeInstance.
            ({ flags, nodeId, parentId, childId }, sort) => ({
                child: new NodeInstance(undefined, nodeId, flags, sort),
                childId,
                parentId: parentId < Effect.WorldId ? parentId : undefined,
            }),

            // Iterate over child-parent pairs.
            ({ child, parent, childId, array }) => {
                parent?.add(child)

                // Pick pairs matching this node instance.
                for (const { targetId } of pairs.filter(({ sourceId }) => sourceId === childId)) {
                    const target = array.find(({ childId }) => targetId == childId)?.child
                    if (target) child.targets.add(target)
                }
            }
        )

        for (const instance of instances) this.add(instance)
    }

    write(view: BufferWriter): void {
        const pairs: Pair[] = []

        // Flattens hierarchy of node instances into entry list.
        const entries: (Entry & { sort: number })[] = [...flatten(this, (instance) => instance, 1)].map(
            (step, _, array) => {
                const {
                    child: source,
                    child: { flags, nodeId, sort },
                    childId,
                    parentId: parentId = Effect.WorldId,
                } = step

                for (const target of source.targets) {
                    const { childId: targetId } = array.find(({ child: value }) => value === target) ?? {}
                    if (targetId)
                        pairs.push({
                            sourceId: childId,
                            targetId: targetId,
                        })
                }

                return { flags, nodeId, parentId, childId, sort }
            }
        )

        entries.sort(({ sort: a }, { sort: b }) => a - b)

        view.writeInt32(entries.length)

        for (const { flags, nodeId, parentId, childId } of entries) {
            view.writeInt32(flags)
            view.writeInt32(nodeId)
            view.writeInt32(parentId)
            view.writeInt32(childId)
        }

        view.writeInt32(pairs.length)

        for (const { sourceId, targetId } of pairs) {
            view.writeInt32(sourceId)
            view.writeInt32(targetId)
        }
    }

    toJSON() {
        return [
            ...this.values()
        ]
    }
}
