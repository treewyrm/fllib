import { findByResourceId } from '../../hash/index.js'
import { joints } from './joint/index.js'
import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import { type BufferReader, type BufferWriter, type Readable, type Writable } from '../../buffer/types.js'
import { type VectorLike } from '../../math/vector.js'
import { QuaternionLike } from '../../math/quaternion.js'

/** Base joint interface. */
export interface Joint extends Readable, Writable {
    /** Base position offset. */
    position: VectorLike

    /** Base orientation. */
    rotation: QuaternionLike
}

/** Constraint entry in constraint list. */
export class Constraint<T extends Joint = InstanceType<(typeof joints)[number]>> implements Readable, Writable {
    kind = 'file'

    constructor(
        /** Constraint joint. */
        public joint: T,

        /** Parent object name. */
        public parent: string = '',

        /** Child object name. */
        public child: string = ''
    ) {}

    get byteLength(): number {
        return 0x80 + this.joint.byteLength
    }

    get filename() {
        const {
            joint: { constructor },
        } = this
        if (!('filename' in constructor && typeof constructor.filename === 'string'))
            throw new Error('Joint constructor is missing filename')
        return constructor.filename
    }

    read(view: BufferReader): void {
        this.parent = view.slice(0x40).readZString()
        this.child = view.slice(0x40).readZString()
        this.joint.read(view)
    }

    write(view: BufferWriter): void {
        view.slice(0x40).writeZString(this.parent)
        view.slice(0x40).writeZString(this.child)
        this.joint.write(view)
    }
}

/** Constraint list represents `Cons` directory. */
export class ConstraintList extends Set<Constraint> {
    readonly kind = 'directory'
    readonly filename = 'Cons'

    read(parent: ReadableDirectory): void {
        for (const [name, file] of parent.files()) {
            const Joint = findByResourceId(joints, 'filename', name)

            if (!Joint) {
                console.warn(`Unknown type of joint: ${name}`)
                continue
            }

            for (const constraint of file.read((_index, _byteOffset, byteRemain) => {
                const constraint = new Constraint(new Joint())
                if (byteRemain < constraint.byteLength) return null
                return constraint
            }))
                this.add(constraint)
        }
    }

    write(parent: WritableDirectory): void {
        for (const constraint of this) parent.setFile(constraint.filename).push(constraint)
    }
}
