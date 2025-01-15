// Lists all materials and where they are defined.
// Usage: -p 'C:\Freelancer\DATA'

import { parseArgs } from 'node:util'
import { listFiles } from './utility.js'
import { Directory } from 'fllib'
import { MaterialLibrary } from 'fllib/utf/material'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const {
    values: { pathname },
} = parseArgs({ options: { pathname: { type: 'string', short: 'p' } } })

if (!pathname) throw new Error('Missing path argument')

const materials = new Map<string, string[]>()
const errors: any[] = []

for await (const filename of listFiles(pathname)) {
    const name = path.join(pathname, filename)

    if (!['.dfm', '.cmp', '.3db', '.mat', '.txm'].some((extension) => filename.endsWith(extension))) continue
    if (!(await stat(name)).size) continue

    try {
        const root = Directory.from(await readFile(path.join(pathname, filename)))

        const library = new MaterialLibrary()
        root.read(library)

        for (const [name, { type }] of library.objects()) {
            const fullName = `${name} (${type})`
            
            if (!materials.has(fullName)) materials.set(fullName, [])
            materials.get(fullName)?.push(filename)
        }
    } catch (error) {
        errors.push(error)
    }
}

for (const [name, filenames] of materials) {
    process.stdout.write(`${name}\n`)
    filenames.forEach((filename) => process.stdout.write(`\t${filename}\n`))
}

if (errors.length) throw new AggregateError(errors, 'One or more errors have occured')
