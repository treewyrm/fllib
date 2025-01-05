import { describe, it } from 'node:test'
import { deepStrictEqual } from 'node:assert'
import * as Sphere from './sphere.js'

describe('Sphere', () => {
    it('Combine separate', () => {
        const a: Sphere.SphereLike = { center: { x: -100, y: 0, z: 0 }, radius: 50 }
        const b: Sphere.SphereLike = { center: { x: 100, y: 0, z: 0 }, radius: 50 }

        deepStrictEqual(Sphere.combine(a, b), { center: { x: 0, y: 0, z: 0 }, radius: 150 })
    })

    it('Comine nested A', () => {
        const a: Sphere.SphereLike = { center: { x: 0, y: 0, z: 0 }, radius: 50 }
        const b: Sphere.SphereLike = { center: { x: 0, y: 0, z: 0 }, radius: 100 }

        deepStrictEqual(Sphere.combine(a, b), { center: { x: 0, y: 0, z: 0 }, radius: 100 })
    })

    it('Comine nested B', () => {
        const a: Sphere.SphereLike = { center: { x: 0, y: 0, z: 0 }, radius: 100 }
        const b: Sphere.SphereLike = { center: { x: 0, y: 0, z: 0 }, radius: 50 }

        deepStrictEqual(Sphere.combine(a, b), { center: { x: 0, y: 0, z: 0 }, radius: 100 })
    })

    it('Comine equal', () => {
        const a: Sphere.SphereLike = { center: { x: 0, y: 0, z: 0 }, radius: 50 }
        const b: Sphere.SphereLike = { center: { x: 0, y: 0, z: 0 }, radius: 50 }

        deepStrictEqual(Sphere.combine(a, b), { center: { x: 0, y: 0, z: 0 }, radius: 50 })
    })
})
