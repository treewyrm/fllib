import { describe } from 'node:test'
import Hardpoints from './hardpoints.js'
import { testBufferObject } from '../buffer/tests.js'
import { getResourceId } from '../hash/index.js'
import { strictEqual } from 'node:assert'

describe('Hardpoints section', () => {
    const ids = ['HpWeapon01', 'HpWeapon02', 'HpMount', 'HpEngine01'].map((name) => getResourceId(name))

    const source = new Hardpoints(ids)
    const target = new Hardpoints(ids)

    testBufferObject(source, target)

    strictEqual(
        ids.every((id) => source.has(id)),
        true
    )
})
