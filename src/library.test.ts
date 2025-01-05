import { describe, it } from 'node:test'
import { deepStrictEqual, strictEqual } from 'node:assert'
import ResourceMap from './resourcemap.js'

interface Thing {
    id: number
    name: string
}

describe('Library class', () => {
    const things = new ResourceMap<Thing>()
    const thing = { id: 0, name: 'My Thing 1' }
    const otherThing = { id: 1, name: 'My Other Thing' }

    it('Setting new item', () => strictEqual(things.set('MyThing1', thing), things))
    it('Size is 1', () => strictEqual(things.size, 1))
    it('Retrieving by name', () => deepStrictEqual(things.get('MyThing1'), thing))
    it('Retrieving by hash', () => deepStrictEqual(things.get(124903838), thing))

    it('Setting another item', () => strictEqual(things.set('MyThing2', otherThing), things))
    it('Size is 2', () => strictEqual(things.size, 2))

    it('Deleting first item', () => strictEqual(things.delete('MyThing1'), true))
    it('Size is 1', () => strictEqual(things.size, 1))

    it('Reverse lookup', () => deepStrictEqual([...things], [['MyThing2', otherThing]]))
})