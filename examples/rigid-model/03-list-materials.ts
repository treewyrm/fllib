import { root, model } from './00-load-model.js'
import { materials } from './00-load-materials.js'
import { Compound } from 'fllib'
import { VMeshLibrary } from 'fllib/utf/vmesh'
import { SinglePassMaterial } from 'fllib/utf/material'

const meshLibrary = new VMeshLibrary()

root.read(meshLibrary)

// This lists all materials in a model.
// const materialIds = listMaterialIds(model, meshLibrary)

const chairMaterial = materials.createMaterial('DcDt', 'chair')
chairMaterial.diffuse.name = 'chair.dds'

const listA: any[] = []

for (const [name, material] of materials) {
    if (material instanceof SinglePassMaterial)
        listA.push({
            name,
            type: material.type,
            diffuse: material.diffuse.name
        })
}

console.table(listA)

// However if we want to know which part uses what materials we can once again list model parts
const listB: any[] = []

if (model instanceof Compound) {
    for (const [child] of model.parts)
        for (const materialId of child.part.getMaterialIds(meshLibrary))
            listB.push({
                part: child.name,
                // name: materials.resolve(materialId)
            })
}

console.table(listB)

// Alternatively we can simply use listMaterialIds and get all materialIds in a model