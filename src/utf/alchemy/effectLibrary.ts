import { getResourceId, type Hashable } from '../../hash/index.js'
import { ReadableDirectory, ReadsDirectory, WritableDirectory, WritesDirectory } from '../types.js'
import { getStringLength, readString, writeString } from './string.js'
import Effect from './effect.js'

export default class EffectLibrary extends Map<string, Effect> implements ReadsDirectory, WritesDirectory {
    readonly filename = 'ALEffectLib'
    readonly kind = 'directory'

    constructor(public version = 1.1) {
        super()
    }

    get byteLength() {
        return (
            Float32Array.BYTES_PER_ELEMENT + // Version.
            Uint32Array.BYTES_PER_ELEMENT + // Effect count.
            Array.from(this).reduce(
                (total, [name, effect]) =>
                    total +
                    getStringLength(name) + // Effect name.
                    (this.version > 1 ? 4 * Float32Array.BYTES_PER_ELEMENT : 0) +
                    effect.byteLength, // Effect size.
                0
            )
        )
    }

    create(name: string) {
        const effect = Effect.withAttachment()
        this.set(name, effect)
        return effect
    }

    get(key: Hashable): Effect | undefined {
        key === getResourceId(key, true)

        for (const [name, effect] of this)
            if (getResourceId(name, true) === key)
                return effect
    
        return
    }

    read(parent: ReadableDirectory): void {
        const file = parent.getFile(this.filename)
        if (!file) throw new Error(`Effect library is missing file ${this.filename}`)

        const { view } = file

        this.version = view.readFloat32()

        for (let i = 0, count = view.readInt32(); i < count; i++) {
            const name = readString(view)
            const effect = new Effect()

            if (this.version > 1) effect.readHeader(view)
            effect.read(view)

            this.set(name, effect)
        }
    }

    write(parent: WritableDirectory): void {
        const file = parent.setFile(this.filename)
        file.byteLength = this.byteLength

        const { view } = file

        view.writeFloat32(this.version)
        view.writeInt32(this.size)

        for (const [name, effect] of this) {
            writeString(view, name)

            if (this.version > 1) effect.writeHeader(view)
            effect.write(view)
        }
    }

    toJSON() {
        return {
            kind: 'alchemy-effect-library',
            effects: Object.fromEntries(this.entries())
        }
    }
}
