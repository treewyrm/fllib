import { getObjectId, type Hashable } from '../hash/index.js'
import Property from './property.js'

/**
 * Section block contains one or more properties.
 *
 * - Section can contain maximum 65535 properties.
 * - Property names are not unique.
 * - Sequence of properties is important.
 *
 * Sections and properties are often interpreted as series of instructions.
 * Hence section and property names can repeat and order can be important.
 */
export default interface Section {
    /** Section name. */
    name: string

    /** Section properties. */
    properties: Property[]

    /** Section line position from text INI or byte offset from binary INI. */
    position?: number

    /** Section comment from text INI. */
    comment?: string
}

export const objectId = (section: Section, property = 'nickname') => {
    property = property.toLowerCase()
    const value = section.properties.find(({ name }) => name.toLowerCase() === property)?.values.at(0)
    return typeof value === 'string' ? getObjectId(value) : 0
}
