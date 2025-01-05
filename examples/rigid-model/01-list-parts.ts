import { model } from './00-load-model.js'
import { iterateModel } from 'fllib'

const list: {
    type: string
    name: string
    parent?: string
    kind: string
    joint?: string
    x: number
    y: number
    z: number
}[] = []

for (const step of iterateModel(model)) {
    const {
        name,
        parent,
        transform: { position },
    } = step

    switch (step.type) {
        case 'part':
            list.push({
                type: step.type,
                name,
                parent,
                kind: step.part.constructor.name,
                joint: step.joint?.constructor.name,
                x: position.x,
                y: position.y,
                z: position.z,
            })

            break
        case 'hardpoint':
            list.push({
                type: step.type,
                name,
                parent,
                kind: step.hardpoint.constructor.name,
                x: position.x,
                y: position.y,
                z: position.z,
            })

            break
    }
}

console.table(list)
