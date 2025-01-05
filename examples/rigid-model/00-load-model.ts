import { Directory } from 'fllib'
import { Rigid } from 'fllib/utf/model'
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const {
    values: { file },
} = parseArgs({ options: { file: { type: 'string', short: 'f' } } })

if (!file) throw new Error('Rigid model not specified')

export const root = Directory.from(await readFile(file))

export const model = Rigid.load(root)
