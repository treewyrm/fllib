import { strictEqual, notStrictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { read } from './text.js'

describe('Text INI', () => {
    it('Reading', () => {
        const lines = `
[SectionA]
propertyA = hello, 12345, 0.15
propertyA = also hello, 12,
propertyB
propertyC = 10, 20, 30, 40

[SectionB]
        `.split('\n')

        const [sectionA, sectionB] = Array.from(read(lines))

        notStrictEqual(sectionA, undefined)
        strictEqual(sectionA!.name, 'SectionA')
        strictEqual(sectionA!.properties.length, 4)

        notStrictEqual(sectionB, undefined)
        strictEqual(sectionB!.name, 'SectionB')
        strictEqual(sectionB!.properties.length, 0)
    })
})
