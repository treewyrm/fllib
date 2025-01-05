/**
 * Lists nodes and effects from ALE.
 */

import { nodes, effects } from './00-load-alchemy.js'
import { NodeInstance } from 'fllib/utf/alchemy'

for (const node of nodes) {
    const list: any[] = []

    console.group(`${node.name} (${node.type})`)

    for (const [name, property] of node.objects()) {
        if ('keyframes' in property) {
            property.keyframes.length
        }

        list.push({
            name,
            type: property.constructor.name,
            value: property.value,
        })
    }

    console.table(list)
    console.groupEnd()
}

/**
 * Recursively walks over node instances and populates list with records.
 * @param list 
 * @param parentId 
 * @param instances 
 */
const listNodeInstances = (list: any[], parentId: number, ...instances: NodeInstance[]) => {
    for (const instance of instances) {
        const [node] = nodes?.get(instance.nodeId) ?? []

        const targets: (string | number)[] = []

        // Node instance can have one or more targets (usually appearance for emitter and field(s) for appearance)
        for (const target of instance.targets) {
            const [node] = nodes?.get(target.nodeId) ?? []

            targets.push(node?.name ?? target.nodeId)
        }

        list.push({
            parentId,
            node: node?.name ?? instance.nodeId,
            flags: instance.flags,
            sort: instance.sort,
            targets: targets.length > 0 ? targets.join(', ') : undefined
        })

        listNodeInstances(list, instance.nodeId, ...instance)
    }
}

for (const [name, effect] of effects) {
    const list: any[] = []

    console.group(name)

    listNodeInstances(list, 0, ...effect)

    list.sort((a, b) => a.sort - b.sort)

    console.table(list)
    console.groupEnd()
}
