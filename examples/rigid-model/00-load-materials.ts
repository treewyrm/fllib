import { Directory } from 'fllib'
import { MaterialLibrary } from 'fllib/utf/material'
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const {
    values: { material },
} = parseArgs({ options: { material: { type: 'string', short: 'm', multiple: true, default: [] } } })

export const materials = new MaterialLibrary()

for (const file of material) {
    let root: Directory | undefined

    try {
        root = Directory.from(await readFile(file))
    } catch (error) {
        console.error(error)
    }

    root?.read(materials)
}
