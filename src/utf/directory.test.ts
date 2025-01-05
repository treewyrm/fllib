import { describe, it } from 'node:test'
import { deepStrictEqual, notStrictEqual, strictEqual } from 'node:assert'
import Directory from './directory.js'

describe('UTF directory', () => {
    it('Creating directory', () => {
        const root = new Directory()

        notStrictEqual(root, undefined)
        strictEqual(root.size, 0)
    })

    it('Creating subdirectory', () => {
        const root = new Directory()
        let a

        strictEqual((a = root.setDirectory('A')), a)
        strictEqual(root.get('A'), a)
    })

    it('Overwriting existing entry', () => {
        const root = new Directory()
        root.setDirectory('A')

        const b = root.setFile('A')

        strictEqual(root.get('A'), b)
        strictEqual(root.size, 1)
    })

    it('Deleting entry', () => {
        const root = new Directory()
        root.setDirectory('A')

        strictEqual(root.delete('A'), true)
        strictEqual(root.size, 0)
    })

    it('Creating subfolders', () => {
        const root = new Directory()
        let a, b

        notStrictEqual((a = root.setDirectory('A')), undefined)
        notStrictEqual((b = root.setDirectory('B')), undefined)

        deepStrictEqual(
            [...root.objects()],
            [
                ['A', a],
                ['B', b],
            ]
        )
    })

    it('Accessing by resource id', () => {
        const root = new Directory()
        const test = root.setDirectory('test')
        const id = 0x061ba27e

        strictEqual(root.get(id), test)
    })
})
