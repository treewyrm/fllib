import { model } from './00-load-model.js'
import { Directory } from 'fllib/utf'
import { writeFile } from 'node:fs/promises'

const root = new Directory()

model.write(root)

const extension = model.isCompound ? 'cmp' : '3db'

await writeFile(`test.${extension}`, root.toBuffer())