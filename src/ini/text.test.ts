import { deepStrictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { read, write } from './text.js'
import Section from './section.js'
import { clear, stringify } from './index.js'

const sections: Section[] = [
    {
        name: 'SectionA',
        properties: [
            {
                name: 'PropertyA',
                values: ['hello', 12345, 0.15],
            },
            {
                name: 'PropertyA',
                values: ['also hello', 12],
            },
            {
                name: 'PropertyB',
                values: [],
            },
            {
                name: 'PropertyC',
                values: [10, 20, 30, 40],
            },
        ],
    },
    {
        name: 'SectionB',
        properties: [],
    },
    {
        name: 'SectionC',
        properties: [
            {
                name: 'prop',
                values: ['something'],
            },
        ],
    },
]

describe('Writing text INI', () => {
    const lines = [...write(sections)]

    describe('Reading text INI', async () => {
        const result = [...read(lines)]

        it('Read result matches written', () => deepStrictEqual(clear(result), stringify(sections)))
    })
})
