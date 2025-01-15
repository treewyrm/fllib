import { getObjectId, type Hashable } from '../hash/index.js'
import type Section from './section.js'
import { objectId } from './section.js'
import { toString } from './value.js'

export * as Value from './value.js'
export * as Binary from './binary.js'
export * as Text from './text.js'

/**
 * Find all sections with matching object id (from hashed `nickname` property)
 * @param sections
 * @param nickname
 */
export function* find(sections: Iterable<Section>, nickname: Hashable): Generator<Section> {
    nickname = getObjectId(nickname)
    for (const section of sections) if (objectId(section) === nickname) yield section
}

/**
 * Removes position/comments from sections and properties.
 * @param sections 
 * @returns 
 */
export const clear = (sections: Section[]) =>
    sections.map(({ name, properties }) => ({
        name,
        properties: properties.map(({ name, values }) => ({ name, values })),
    }))
 
export const stringify = (sections: Section[]) =>
    sections.map(({ name, properties }) => ({
        name,
        properties: properties.map(({ name, values }) => ({ name, values: values.map(toString) }))
    }))