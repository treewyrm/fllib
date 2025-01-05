/**
 * This script was used to process all ship models in Discovery mod to do:
 * - Add HpOrigin hardpoint to Root at midpoint between bounding sphere and box
 * - Create a copy of HpEngine01 hardpoint for Root (HpEngineInternal) at the same place relative to Root rather than its original part.
 */

import { Directory } from 'fllib/utf'
import { Rigid, iterateModel, Model } from 'fllib/utf/model'
import { Fixed } from 'fllib/utf/hardpoint'
import { Vector, Box, Quaternion, Transform } from 'fllib/math'

import { readFile, writeFile, copyFile, stat } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import path from 'node:path'
import { listFiles } from '../utility.js'

/**
 * Finds midpoint between bounding box and bounding sphere of a model.
 * @param model
 * @returns
 */
const getOrigin = (model: Model<Rigid>): Vector.VectorLike =>
    Vector.lerp(0.5, Box.center(Rigid.getBoundaryBox(model)), Rigid.getBoundarySphere(model).center)

/**
 * Finds transform of HpEngine01 hardpoint relative to Root.
 * @param model
 * @returns
 */
const findEngine = (model: Model<Rigid>): Transform.TransformLike | undefined => {
    for (const step of iterateModel(model))
        if (step.type === 'hardpoint' && step.name === 'HpEngine01') return step.transform
}

/**
 * Process model.
 * @param filename
 */
async function process(filename: string): Promise<void> {
    console.log(`Processing ${filename}`)

    // Create a backup copy.
    // await copyFile(filename, `${filename}.bak`)

    // Read root directory from UTF.
    const root = Directory.from(await readFile(filename))

    // Read rigid model from UTF.
    const model = Rigid.load(root)

    const hardpoint = new Fixed()
    hardpoint.position = getOrigin(model)

    // Adds HpOrigin hardpoint to root part or part itself.
    model.isCompound
        ? model.part.hardpoints.set('HpOrigin', hardpoint)
        : model.hardpoints.set('HpOrigin', hardpoint)

    const transform = findEngine(model)
    if (transform) {
        const hardpoint = new Fixed()

        hardpoint.position = Vector.copy(transform.position)
        hardpoint.orientation = Quaternion.copy(transform.orientation)

        // Adds HpEngineInternal hardpoint to root part or part itself (a bit redundant).
        model.isCompound
            ? model.part.hardpoints.set('HpEngineInternal', hardpoint)
            : model.hardpoints.set('HpEngineInternal', hardpoint)
    }

    // Write updated model back into root directory.
    model.write(root)

    // Write out.
    await writeFile(filename, root.toBuffer())
}

const {
    values: { path: pathname },
} = parseArgs({ options: { path: { type: 'string', short: 'p' } } })
if (!pathname) throw new Error('Missing pathname')

const errors: any[] = []

for await (const filename of listFiles(pathname, true)) {
    const filepath = path.join(pathname, filename)

    // Check for size, ignore 0 byte files.
    const stats = await stat(filepath)
    if (!stats.size) continue

    // Only pick 3db or cmp files.
    if (!(filename.endsWith('.3db') || filename.endsWith('.cmp'))) continue

    try {
        await process(filepath)
    } catch (error) {
        errors.push({ error, filepath })
    }
}

if (errors.length > 0) throw new AggregateError(errors, 'One or more errors have occured')
