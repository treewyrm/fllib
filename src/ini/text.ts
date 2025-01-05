import Property from './property.js'
import Section from './section.js'

const CommentDelimiter = ';'
const AssignmentDelimiter = '='
const ValueSeparator = ','
const SectionStart = '['
const SectionEnd = ']'

/**
 * Parse strings into sections, properties and values.
 * @param strings Text lines
 */
export function* read(strings: Iterable<string>): Generator<Section> {
    let section: Section | undefined
    let property: Property | undefined

    let comment: string
    let name: string
    let value: string
    let count = 0

    for (let string of strings) {
        count++

        ;[string = '', comment = ''] = string.trim().split(CommentDelimiter, 2)
        string = string.trim()

        if (!string.length) continue

        if (string.at(0) === SectionStart) {
            if (section) yield section
            section = undefined

            if (string.at(-1) === SectionEnd) {
                name = string.substring(1, string.length - 1).trim()
                section = new Section(name)
                section.position = count
                section.comment = comment

                continue
            }
        }

        // Ignore lines outside sections.
        if (!section) continue

        // Split line into name and values.
        ;[name = '', value = 'true'] = string.split(AssignmentDelimiter, 2).map((value) => value.trim())

        property = new Property(name, value.split(ValueSeparator).map((value) => value.trim()))
        property.position = count
        property.comment = comment

        section.properties.push(property)
    }

    if (section) yield section
}

/**
 * Convert sections and properties into text lines.
 * @param sections 
 */
export function* write(sections: Iterable<Section>, comments = false): Generator<string> {
    for (const { name, properties, comment } of sections) {
        yield `[${name}]${comments && comment ? ` ; ${comment}` : ''}`

        for (const { name, values, comment } of properties)
            yield `${name} = ${values.join(',')}${comments && comment ? ` ; ${comment}` : ''}`
    }
}
