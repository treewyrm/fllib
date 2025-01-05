import { Directory } from 'fllib'
import { NodeLibrary, EffectLibrary } from 'fllib/utf/alchemy'
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const { values: { file } } = parseArgs({ options: { file: { type: 'string', short: 'f' } } })
if (!file) throw new Error('Alchemy file not specified')

const root = Directory.from(await readFile(file))

export const nodes = new NodeLibrary()
export const effects = new EffectLibrary()

root.read(nodes)
root.read(effects)