import { describe, it } from 'node:test'
import { read, write } from './binary.js'
import type Section from './section.js'
import { deepStrictEqual } from 'node:assert'
import { clear } from './index.js'

const sections: Section[] = [
    {
        name: 'Something',
        properties: [
            {
                name: 'Prop1',
                values: ['value1', 0xffff, true],
            },
            {
                name: 'material_library',
                values: ['li_fighter.mat'],
            },
            {
                name: 'material_library',
                values: ['common.mat'],
            },
        ],
    },
]

describe('Writing binary INI buffer', () => {
    const buffer = write(sections)

    describe('Reading binary INI buffer', () => {
        const result = clear([...read(buffer)])

        it('Read result matches written', () => deepStrictEqual(result, sections))
    })
})
