import { concat } from '../buffer/utility.js'
import Dictionary from '../buffer/dictionary.js'
import BufferView from '../buffer/view.js'
import type Section from './section.js'
import type Value from './value.js'
import { type BufferReader, type BufferWriter } from '../buffer/types.js'

enum Type {
    Bool,
    Integer,
    Float,
    String,
}

class Header {
    readonly byteLength = Uint32Array.BYTES_PER_ELEMENT * 3

    readonly signature = 0x494e4942
    readonly version = 0x1

    nameOffset = 0

    read(view: BufferReader): void {
        if (view.readUint32() !== this.signature) throw new Error('Invalid BINI signature')
        if (view.readUint32() !== this.version) throw new RangeError('Unsupported BINI version')
        this.nameOffset = view.readUint32()
    }

    write(view: BufferWriter): void {
        view.writeUint32(this.signature)
        view.writeUint32(this.version)
        view.writeUint32(this.nameOffset)
    }
}

/**
 * Read BINI into sections.
 * @param input
 */
export function* read(input: Uint8Array): Generator<Section> {
    const view = BufferView.from(input)
    const header = new Header()

    header.read(view)

    const { nameOffset } = header
    const dictionary = new Uint8Array(view.buffer, view.byteOffset + nameOffset)
    const decoder = new TextDecoder()

    /**
     * Read string from dictionary.
     * @param start
     * @returns
     */
    const readString = (start: number): string => {
        const end = dictionary.indexOf(0, start)
        if (end < 0) throw new RangeError(`String offset ${start} is out of range`)

        return decoder.decode(dictionary.subarray(start, end))
    }

    let name: string
    let section: Section
    let values: Value[]
    let position: number

    // Read sections.
    while (view.offset < nameOffset) {
        position = view.offset
        name = readString(view.readUint16())
        section = {
            name,
            properties: [],
            position,
        }

        // Read section properties.
        for (let index = 0, length = view.readUint16(); index < length; index++) {
            position = view.offset
            name = readString(view.readUint16())
            values = []

            // Read property values.
            for (let index = 0, length = view.readUint8(); index < length; index++) {
                switch (view.readUint8()) {
                    case Type.Bool:
                        values[index] = view.readUint32() > 0
                        break
                    case Type.Integer:
                        values[index] = view.readInt32()
                        break
                    case Type.Float:
                        values[index] = view.readFloat32()
                        break
                    case Type.String:
                        values[index] = readString(view.readUint32())
                        break
                    default:
                        throw new TypeError('Invalid property value type.')
                }
            }

            section.properties.push({
                name,
                values,
                position,
            })
        }

        yield section
    }
}

type Record = {
    /** Section name offset. */
    offset: number

    /** Section properties. */
    properties: {
        /** Property name offset. */
        offset: number

        /** Property values. */
        values: Value[]
    }[]
}

/**
 * Calculate BINI record byte length.
 * @param record 
 * @returns 
 */
const getRecordByteLength = ({ properties }: Record) =>
    Uint16Array.BYTES_PER_ELEMENT +
    Uint16Array.BYTES_PER_ELEMENT +
    properties.reduce(
        (total, { values }) =>
            total +
            Uint16Array.BYTES_PER_ELEMENT +
            Uint8Array.BYTES_PER_ELEMENT +
            values.length * (Uint8Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT),
        0
    )

/**
 * Write sections into BINI.
 * @param sections
 * @returns
 */
export function write(sections: Iterable<Section>): Uint8Array {
    const header = new Header()

    const names = new Dictionary()
    const texts = new Dictionary()

    /** Section records with offsets. */
    const records: Record[] = []

    // Store section and property names.
    for (const section of sections) {
        records.push({
            offset: names.push(section.name)[0],
            properties: section.properties.map(({ name, values }) => ({
                offset: names.push(name)[0],
                values,
            })),
        })
    }

    // Allocate body list.
    const body = BufferView.from(records.reduce((total, record) => total + getRecordByteLength(record), 0))

    header.nameOffset = header.byteLength + body.byteLength

    for (const { offset, properties } of records) {
        body.writeUint16(offset)
        body.writeUint16(properties.length)

        for (const { offset, values } of properties) {
            body.writeUint16(offset)
            body.writeUint8(values.length)

            for (const value of values) {
                switch (typeof value) {
                    case 'boolean':
                        body.writeUint8(Type.Bool)
                        body.writeUint32(value ? 0x8000000 : 0)

                        break
                    case 'number':
                        if (Number.isSafeInteger(value)) {
                            body.writeUint8(Type.Integer)
                            body.writeInt32(value)
                            break
                        }

                        body.writeUint8(Type.Float)
                        body.writeFloat32(value)

                        break
                    case 'string':
                        body.writeUint8(Type.String)
                        body.writeUint32(names.byteLength + texts.push(value)[0])

                        break
                    default:
                        throw new TypeError('Invalid property value type.')
                }
            }
        }
    }

    return concat(header, body, names.buffer, texts.buffer)
}
