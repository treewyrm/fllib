import ResourceMap from '../../dist/resourcemap.js'
import { nodes, effects } from './00-load-alchemy.js'

for (const node of nodes) {
    node.name = node.name
}

// console.log(ResourceMap.names)

console.log(JSON.stringify({ nodes, effects }, undefined, 2))
