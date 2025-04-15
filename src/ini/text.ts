import Property from './property.js'
import Section from './section.js'

const CommentDelimiter = ';'
const AssignmentDelimiter = '='
const ValueSeparator = ','
const SectionStart = '['
const SectionEnd = ']'

/**
 * Reads lines into INI sections.
 * @param lines
 * @returns
 */
export function* read(lines: Iterable<string>): Generator<Section> {
    let section: Section | undefined
    let comment: string | undefined
    let position = 0
    let name = ''
    let value = ''

    for (let line of lines) {
        position++
        ;[line = '', comment] = line.trim().split(CommentDelimiter, 2)
        line = line.trim()

        if (!comment?.length) comment = undefined

        if (!line.length) continue

        if (line.at(0) === SectionStart) {
            if (section) yield section
            section = undefined

            if (line.at(-1) === SectionEnd)
                section = {
                    name: line.substring(1, line.length - 1).trim(),
                    properties: [],
                    position,
                    comment,
                }

            continue
        }

        // Ignore lines outside sections.
        if (!section)
            continue

            // Split line into name and values.
        ;[name = '', value = ''] = line.split(AssignmentDelimiter, 2).map((value) => value.trim())

        section.properties.push({
            name,
            values: value.length > 0 ? value.split(ValueSeparator).map((value) => value.trim()) : [],
            position,
            comment,
        })
    }

    if (section) yield section
}

type TextOptions = {
    emptyLineBetweenSections?: boolean
    comments?: boolean
    lowercase?: boolean
}

function* writeProperties(properties: Iterable<Property>, options?: TextOptions): Generator<string> {
    const { comments = false } = options ?? {}

    for (const { name, values, comment } of properties)
        yield `${name} = ${values.join(', ')}${comments && comment ? ` ; ${comment}` : ''}`
}

/**
 * Convert sections and properties into text lines.
 * @param sections
 */
export function* write(sections: Iterable<Section>, options?: TextOptions): Generator<string> {
    const { comments = false, emptyLineBetweenSections = true } = options ?? {}

    for (const { name, properties, comment } of sections) {
        yield `[${name}]${comments && comment ? ` ; ${comment}` : ''}`
        yield* writeProperties(properties, options)
        if (emptyLineBetweenSections) yield ''
    }
}
