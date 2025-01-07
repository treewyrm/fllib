import { type ReadableDirectory, type WritableDirectory, type ReadsDirectory, type WritesDirectory } from '../types.js'

/**
 * Dynamic cube-sphere model. Used for planets and moons.
 * Side count (6 and 7 are used, others need to be checked):
 * - 1 (all)
 * - 2 (all, atmosphere)
 * - 3 (top, bottom, front + right + back + left)
 * - 4 (top, bottom, front + back, left + right)
 * - 5 (top, bottom, front + back, left + right, atmosphere)
 * - 6 (top, bottom, front, right, back, left)
 * - 7 (top, bottom, front, right, back, left, atmosphere)
 */
export default class Sphere implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'
    readonly filename = 'Sphere'

    sides: string[] = []
    radius = 1000

    read(parent: ReadableDirectory): void {
        const sides = parent.getFile('Sides')
        if (!sides) throw new Error('Sphere model is missing sides count')

        const [count] = sides.readIntegers()
        if (!(Number.isInteger(count) && count && count > 0))
            throw new RangeError('Sphere model has invalid sides count')

        for (let i = 0; i < count; i++) {
            const side = parent.getFile(`M${i}`)
            if (!side) throw new Error(`Sphere model is missing side ${i}`)

            const [material] = side.readStrings()
            if (!material) throw new Error(`Sphere model side ${i} is missing material name`)

            this.sides[i] = material
        }

        const radius = parent.getFile('Radius')
        if (!radius) throw new Error('Sphere model is missing radius')
        ;[this.radius = 1000] = radius.readFloats()
    }

    write(parent: WritableDirectory): void {
        parent.setFile('Sides').writeIntegers(this.sides.length)
        parent.setFile('Radius').writeFloats(this.radius)

        for (const [index, material] of this.sides.entries()) parent.setFile(`M${index}`).writeStrings(material)
    }
}
