import { Directory } from 'fllib'
import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const {
    values: { file },
} = parseArgs({ options: { file: { type: 'string', short: 'f' } } })

if (!file) throw new Error('Missing filename')

console.log(`Reading ${file}`)

const root = Directory.from(await readFile(file))
const buffers: ArrayBuffer[] = []

console.log(`Writing ${file}.json`)
await writeFile(`${file}.json`, JSON.stringify(root.toJSON(buffers), undefined, 2))

console.log(`Writing ${file}.bin`)
await writeFile(`${file}.bin`, buffers.map((buffer) => Buffer.from(buffer)))

console.log('Completed')
