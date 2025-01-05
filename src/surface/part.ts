import { type BufferReader, type BufferWriter } from '../buffer/types.js'
import Extents from './extents.js'
import Hardpoints from './hardpoints.js'
import Surfaces from './surfaces.js'

enum Type {
    NotFixed = '!fxd',
    Extents = 'exts',
    Surfaces = 'surf',
    Hardpoints = 'hpid',
}

const SectionMap = {
    [Type.Extents]: Extents,
    [Type.Surfaces]: Surfaces,
    [Type.Hardpoints]: Hardpoints,
} as const

type SectionList = { -readonly [K in keyof typeof SectionMap]?: InstanceType<(typeof SectionMap)[K]> }

function validateSectionType(value: unknown): asserts value is keyof typeof SectionMap {
    if (typeof value !== 'string') throw new TypeError('Invalid section value type')
    if (!(value in SectionMap)) throw new RangeError('Invalid section type')
}

/**
 * Corresponds to rigid model part.
 * - For compound models `id` will be a resource id of compound object name.
 * - For non-compound models `id` will be 0.
 * - Root part of compound models **must** have `fixed` property set to false.
 */
export default class Part {
    /** Referenced part CRC. */
    id = 0

    /** Part is fixed. */
    fixed = true

    /** Sections. */
    sections: SectionList = {}

    /** Used section count. */
    get sectionCount(): number {
        return Object.values(this.sections).filter((section) => section !== undefined).length + (this.fixed ? 0 : 1)
    }

    /** Part total byte length. */
    get byteLength(): number {
        return (
            Uint32Array.BYTES_PER_ELEMENT + // Id.
            Uint32Array.BYTES_PER_ELEMENT + // Section count.
            (this.fixed ? 0 : Uint32Array.BYTES_PER_ELEMENT) + // !fxd tag.
            Object.values(this.sections).reduce(
                (total, { byteLength }) => total + Uint32Array.BYTES_PER_ELEMENT + byteLength,
                0
            )
        )
    }

    /**
     * Reads part data.
     * @param input
     */
    read(input: BufferReader): void {
        this.id = input.readInt32()

        for (let i = 0, l = input.readUint32(); i < l; i++) {
            const type = input.slice(4).readZString()

            // Set !fxd flag.
            if (type === Type.NotFixed) {
                this.fixed = false
                continue
            }

            validateSectionType(type)

            const section = new SectionMap[type]()
            section.read(input)

            switch (true) {
                case section instanceof Extents:
                    this.sections[Type.Extents] = section
                    break
                case section instanceof Surfaces:
                    this.sections[Type.Surfaces] = section
                    break
                case section instanceof Hardpoints:
                    this.sections[Type.Hardpoints] = section
                    break
            }
        }
    }

    /**
     * Write part data.
     * @param output 
     */
    write(output: BufferWriter): void {
        output.writeInt32(this.id)
        output.writeUint32(this.sectionCount)

        // Write !fxd for non-fixed part.
        if (!this.fixed) output.slice(4).writeZString(Type.NotFixed)

        for (const [type, section] of Object.entries(this.sections)) {
            output.slice(4).writeZString(type)
            section.write(output)
        }
    }
}
