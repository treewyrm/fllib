import { getObjectId, Hashable } from '../hash/index.js'
import Property from './property.js'
import Section from './section.js'
export { Section, Property }

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
    for (const section of sections) if (section.objectId === nickname) yield section
}