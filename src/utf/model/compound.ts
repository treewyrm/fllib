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
    index = 0

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
                    const [filename = ''] = directory.getFile('File name')?.readStrings() ?? []
                    // const scale = parseFloat(directory.getFile('Scale')?.text ?? '1') // Appears in deformable, seems unused.

                    if (!filename.length) throw new Error(`Missing file name in ${name}`)

                    // Find fragment folder for part.
                    const fragment = parent.getDirectory(filename)
                    if (!fragment) throw new Error(`Missing fragment ${filename} in ${name}`)

                    const part = new Compound(loadPart(fragment), new DefaultJoint())
                    part.filename = filename

                    ;[part.index = 0] = directory.getFile('Index')?.readIntegers() ?? []
                    ;[part.name = ''] = directory.getFile('Object name')?.readStrings() ?? []

                    if (!part.name.length) throw new Error(`Missing object name in ${name}`)
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

    write(parent: WritableDirectory): void {
        /** Compound directory. */
        const compound = parent.setDirectory('Cmpnd')

        /** Model constraint list. */
        const constraints = new ConstraintList()

        /** Unique object names. */
        const names = new Set<string>()

        for (const [element] of this.parts) {
            const { name, filename, index, part } = element

            if (!name.length) throw new RangeError('Compound part has empty object name')
            if (!filename.length) throw new RangeError('Compound part has empty file name')
            if (names.has(name)) throw new Error(`Duplicate compound part name: ${element.name}`)
            if (!Number.isInteger(index)) throw new RangeError(`Non-integer part index.`)
            
            names.add(name)

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
