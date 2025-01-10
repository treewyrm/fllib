import { findByResourceId, type Hashable } from '../../hash/index.js'
import { recurse } from '../../utility.js'
import Directory, { type ReadFromDirectory } from '../directory.js'
import { type WritableDirectory, WritesDirectory, type ReadableDirectory } from '../types.js'
import { Constraint, ConstraintList, type Joint } from './constraint.js'
import DefaultJoint from './joint/loose.js'
import type Part from './part.js'

/** Model object as either individual part or compound hierarchy of parts. */
export type Model<T extends Part> = T | Compound<T>

/** Child to parent tuple returned by compound parts. */
type CompoundTuple<T extends Part> = [child: Compound<T>, parent?: Compound<T>]

/** Lists hardpoints in a compound model. */
function* listHardpoints<T extends Part>({ parts }: Compound<T>) {
    for (const [parent] of parts)
        for (const [name, hardpoint] of parent.part.hardpoints.objects()) yield [name, hardpoint, parent] as const
}

const getFragmentFilename = (name: string, date = new Date()) =>
    `${name}${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}.3db`

/** Compound model hierarchy element. */
export default class Compound<T extends Part> extends Set<Compound<T>> implements WritesDirectory {
    readonly kind = 'directory'

    get [Symbol.toStringTag]() {
        return 'Compound'
    }

    readonly isCompound = true

    /** Name. */
    name = ''

    /** Index. */
    index?: number

    /** Filename. */
    filename = ''

    constructor(
        /** Compound object. */
        public part: T,

        /** Joint to parent. */
        public joint: Joint,

        ...args: ConstructorParameters<typeof Set<Compound<T>>>
    ) {
        super(...args)
    }

    /** Lists all hardpoints in this part and its descendants. */
    get hardpoints() {
        return listHardpoints(this)
    }

    /** Compound hierarchy as child to parent tuples. */
    get parts() {
        return recurse<CompoundTuple<T>>([[this]], ([parent]) => [...parent].map((child) => [child, parent]))
    }

    /**
     * Finds compound element by name.
     * @param name
     * @returns
     */
    getPart(name: Hashable): Compound<T> | undefined {
        return findByResourceId(
            recurse(this, (compound) => compound),
            'name',
            name
        )
    }

    /**
     * Loads model from a directory.
     * @param parent Root directory
     * @param loadPart Loads directory as individual part
     * @returns
     */
    static from<T extends Part>(parent: ReadableDirectory, loadPart: ReadFromDirectory<T>): Compound<T> | undefined {
        const compound = parent.getDirectory('Cmpnd')

        // If parent directory does not have Cmpnd then assume it is a single part.
        if (!compound) return

        /** Parts of the compound model. */
        const parts: Compound<T>[] = []

        /** Root part. */
        let root: Compound<T> | undefined

        /** Constraints connecting parts into hierarchy tree. */
        let constraints: ConstraintList | undefined

        // Parse parts.
        for (const [name, directory] of compound.directories()) {
            let isRoot = false

            /**
             * This is what the game does: it reads four chars of a directory name and
             * determines whether it is a part, root part or constraint list.
             */
            switch (name.substring(0, 4).toLowerCase()) {
                case 'root':
                    isRoot = true
                case 'part':
                    const objectname = directory.getFile('Object name')?.readString()
                    if (!objectname) throw new Error(`Missing compound object name in ${name}`)

                    const filename = directory.getFile('File name')?.readString()
                    if (!filename) throw new Error(`Missing compound object file name in ${name}`)

                    const index = directory.getFile('Index')?.readInteger() ?? 0

                    // Find fragment folder for part.
                    const fragment = parent.getDirectory(filename)
                    if (!fragment) throw new Error(`Missing compound object fragment ${filename} for ${name}`)

                    const part = new Compound(loadPart(fragment), new DefaultJoint())

                    part.filename = filename
                    part.index = index
                    part.name = objectname

                    if (isRoot) root = part

                    parts.push(part)
                    break
                case 'cons':
                    constraints = new ConstraintList()
                    constraints.read(directory)
            }
        }

        // If root part was not defined explicitly the first part becomes it.
        // If Cmpnd had no parts then this is model is invalid.
        if (!(root ??= parts.at(0))) throw new Error('Compound model has no parts')

        // Model contains no tree, meaning it's a compound model with a single part.
        if (!constraints) return root

        // Place all parts (except root) into a pool.
        const orphans = new Set([...parts.filter((part) => part !== root)])
        const missing = new Set<string>()

        // Assign hierarchy.
        for (const { parent: parentName, child: childName, joint } of constraints) {
            const parent = findByResourceId(parts, 'name', parentName)
            const child = findByResourceId(orphans, 'name', childName)

            if (!parent) missing.add(parentName)
            if (!child) missing.add(childName)
            if (!parent || !child) continue

            child.joint = joint
            parent.add(child)
            orphans.delete(child) // A part cannot be a child to multiple parents.
        }

        // Warn about orphaned parts.
        if (orphans.size > 0)
            console.warn(`Orphaned parts: ${[...orphans.values()].map(({ name }) => name).join(', ')}`)

        // Warn about missing parts.
        if (missing.size > 0) console.warn(`Unused/missing parts: ${[...missing.values()].join(', ')}`)

        return root
    }

    write(parent: WritableDirectory, root = 'root'): void {
        /** Compound directory. */
        const compound = parent.setDirectory('Cmpnd')

        /** Model constraint list. */
        const constraints = new ConstraintList()

        /** Unique object names. */
        const names = new Set<string>()
        const indices: number[] = []

        for (const [element] of this.parts) {
            const {
                name,
                filename = getFragmentFilename(name === this.name ? root : name),
                index = Math.max(0, ...indices) + 1,
                part,
            } = element

            if (!name.length) throw new RangeError(`Compound part has empty object name`)
            if (names.has(name)) throw new Error(`Duplicate compound part name: ${name}`)
            if (!Number.isInteger(index)) throw new RangeError(`Non-integer compound part index in ${name}`)

            names.add(name)
            indices.push(index)

            const directory = compound.setDirectory(name === this.name ? 'Root' : `Part_${name}`)

            directory.setFile('Object name').writeStrings(name)
            directory.setFile('File name').writeStrings(filename)
            directory.setFile('Index').writeIntegers(index)

            for (const { joint, name } of element) constraints.add(new Constraint(joint, element.name, name))

            const fragment = new Directory()
            part.write(fragment)

            parent.adopt([filename, fragment])
        }

        // Write constraint list.
        if (constraints.size > 0) compound.write(constraints)
    }
}
