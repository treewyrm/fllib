import { Animation } from 'fllib/utf/model'
import { Directory } from 'fllib/utf'
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const {
    values: { file },
} = parseArgs({ options: { file: { type: 'string', short: 'f' } } })

if (!file) throw new Error('Animation library file (.anm) not specified')

const root = Directory.from(await readFile(file))

const animation = root.read(new Animation())
if (!animation) throw new Error('Model does not contain animation')

for (const [name, script] of animation.objects()) {
    console.group(name)

    const list: {
        child?: string
        parent: string
        type: number
        interval: number
        start: number
        duration: number
        count: number
    }[] = []

    let minStart = Infinity
    let maxEnd = -Infinity

    // Loop through joint maps
    for (const { child, parent, channel: { type, interval, range, keyframes } } of script.jointMaps) {
        const [start, end] = range
        const duration = Math.max(0, end - start)

        minStart = Math.min(minStart, start)
        maxEnd = Math.max(maxEnd, end)

        list.push({ child, parent, type, interval, start, duration, count: keyframes.length })
    }

    // Loop through object maps
    for (const { parent, channel: { type, interval, range, keyframes } } of script.objectMaps) {
        const [start, end] = range
        const duration = Math.max(0, end - start)

        minStart = Math.min(minStart, start)
        maxEnd = Math.max(maxEnd, end)
        
        list.push({ parent, type, interval, start, duration, count: keyframes.length })
    }

    console.log(`Start: ${minStart}, End: ${maxEnd}, Duration: ${maxEnd - minStart}`)
    
    console.table(list)
    console.groupEnd()
}