import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { getResourceId, getObjectId } from './index.js'

describe('Hash', () => {
    it('Resource id match (case sensitive)', () => strictEqual(getResourceId('*Test', true), 0x1f79497b | 0))
    it('Resource id match (case insensitive)', () => strictEqual(getResourceId('*Test', false), -8939899))

    it('Object id match (case insensitive)', () => strictEqual(getObjectId('*Test', false), -1952295158))
    it('Object id for number', () => strictEqual(getObjectId(0x8ba2570a), -1952295158))
})
