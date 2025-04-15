// Extracts news headlines from infocards and put them into comment for news.ini

import { parseArgs } from 'node:util'
import { readINI } from './00-read-texts.js'
import { Value, Text, Section } from 'fllib/ini'
import { readInfocards } from './00-read-texts.js'
import path from 'node:path'

const {
    values: { path: pathname },
} = parseArgs({ options: { path: { type: 'string', short: 'p' } } })

if (!pathname) throw new Error('Missing Freelancer path')

/** News filename. */
const filename = path.join(pathname, 'DATA', 'MISSIONS', 'news.ini')

const { texts, names } = await readInfocards(pathname)

const sections: Section[] = []

for await (const section of await readINI(filename)) {
    let headline = 0

    sections.push(section)

    for (const property of section.properties) {
        switch (property.name) {
            case 'headline':
                [headline] = Value.format(property.values, 'integer')

                section.comment = names.get(headline)
                break
        }
    }
}

for (const line of Text.write(sections, { comments: true, emptyLineBetweenSections: true })) {
    process.stdout.write(line + '\r\n')
}
