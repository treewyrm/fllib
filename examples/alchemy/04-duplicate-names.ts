import { parseArgs } from 'node:util'
import { listFiles } from '../utility.js'
import path from 'node:path'
import { readFile, stat } from 'node:fs/promises'
import { Directory } from 'fllib'
import { NodeLibrary, EffectLibrary } from 'fllib/utf/alchemy'
import { getResourceId } from 'fllib/hash'

const { values: { path: pathname } } = parseArgs({ options: { path: { type: 'string', short: 'p' } } })
if (!pathname) throw new Error('Alchemy file not specified')

const effectNames = new Map<string, string>()
const effectCRCs = new Map<number, string>()

const nodeNames = new Map<string, string>()

const effectErrors: any[] = []
const nodeErrors: any[] = []

const errors: any[] = []

const badFiles: string[] = []

for await (const filename of listFiles(pathname)) {
    try {
        if (!filename.endsWith('.ale')) continue
        if (!(await stat(path.join(pathname, filename))).size) continue

        // console.log(filename)
        const file = await readFile(path.join(pathname, filename))

        const root = Directory.from(file)
        const nodes = new NodeLibrary()
        const effects = new EffectLibrary()
        
        root.read(nodes)
        root.read(effects)

        for (const name of effects.keys()) {
            if (effectNames.has(name))
                effectErrors.push(new Error(`Effect ${name} in ${filename} is already defined in ${effectNames.get(name)}`))

            effectNames.set(name, filename)

            const crc = getResourceId(name, true)

            // if (effectCRCs.has(crc))
            //     effectErrors.push(new Error(`Effect CRC ${crc} (${name}) in ${filename} is already defined in ${effectCRCs.get(crc)} `))

            effectCRCs.set(getResourceId(name), filename)

            // console.log(name)
        }

        for (const node of nodes) {
            const { name } = node

            if (nodeNames.has(name))
                nodeErrors.push(new Error(`Node ${name} in ${filename} is already defined in ${nodeNames.get(name)}`))

            nodeNames.set(name, filename)
        }

    } catch (error) {
        errors.push(new Error(`Error reading ${filename}: ${error}`, { cause: error }))
        badFiles.push(filename)
    }
}

// if (badFiles.length) console.dir(badFiles)

// if (effectErrors.length) throw new AggregateError(effectErrors, 'One or more errors have occured')

for (const error of effectErrors)
    process.stdout.write(error.message + '\r\n')

for (const error of nodeErrors)
    process.stdout.write(error.message + '\r\n')