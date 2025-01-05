import BufferView from '../buffer/view.js'
import Part from './part.js'
import Extents from './extents.js'
import Hardpoints from './hardpoints.js'
import Surfaces from './surfaces.js'
import Hull from './hull.js'
import type Face from './face.js'
import Point from './point.js'
import Node from './node.js'
import { concat } from '../buffer/utility.js'

const signature = 0x73726576 // 'vers'
const version = Math.fround(2.0)

/**
 * Load surface parts from buffer.
 * @param buffer
 * @returns
 */
export function* load(buffer: Uint8Array): Generator<Part> {
    const view = BufferView.from(buffer)

    if (view.readUint32() !== signature) throw new Error('Invalid SUR header')
    if (view.readFloat32() !== version) throw new RangeError('Invalid SUR version')

    while (view.byteRemain) yield view.read(new Part())
}

/**
 * Save surface parts into buffer.
 * @param parts
 * @returns
 */
export function save(parts: Iterable<Part>): Uint8Array {
    const view = BufferView.from(Uint32Array.BYTES_PER_ELEMENT * 2)
    view.writeUint32(signature)
    view.writeFloat32(version)

    return concat(view, ...parts)
}

export { Part, Extents, Hardpoints, Surfaces, Hull, Face, Point, Node }
