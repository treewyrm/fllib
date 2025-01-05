import { type BufferReader, type BufferWriter } from '../buffer/types.js'
import { type VectorLike, BYTES_PER_ELEMENT } from '../math/vector.js'
import { readVector, writeVector } from './utility.js'
import Point from './point.js'
import Node from './node.js'
import Hull from './hull.js'

/**
 * Surfaces section contains:
 * - Boundary sphere (center vector and radius)
 * - Boundary sphere radius multiplier for hulls excluding hardpoints hulls.
 * - Linear drag vector
 * - 3D points
 * - Convex hulls
 * - Boundary volume hierarchy tree
 **/
export default class Surfaces implements Iterable<Node> {
    /** Center of mass and bounding sphere center. Used for aiming reticle. */
    center: VectorLike = { x: 0, y: 0, z: 0 }

    /** Default linear drag. */
    linearDrag: VectorLike = { x: 0, y: 0, z: 0 }

    /** Bounding sphere radius. Must encompass all hulls of a part. */
    radius = 0

    /** Bounding sphere radius multiplier for hulls not listed in hardpoints. */
    radiusScale = 1

    /** Hull points. */
    points: Point[] = []

    /** Root node of boundary volume hierarchy. */
    root?: Node

    /** Unknown vector. Appears unused. */
    unknown: VectorLike = { x: 0, y: 0, z: 0 }

    get byteLength(): number {
        let hullsLength = 0
        let nodesLength = 0

        for (const node of this) {
            nodesLength +=
                Int32Array.BYTES_PER_ELEMENT + // Child node offset.
                Int32Array.BYTES_PER_ELEMENT + // Hull offset.
                node.byteLength // Node data.

            if (node.hull) hullsLength += Int32Array.BYTES_PER_ELEMENT + node.hull.byteLength
        }

        let pointsLength = this.points.reduce((length, { byteLength }) => length + byteLength, 0)

        return (
            Uint32Array.BYTES_PER_ELEMENT + // Size.
            BYTES_PER_ELEMENT + // Center.
            BYTES_PER_ELEMENT + // Linear drag.
            Float32Array.BYTES_PER_ELEMENT + // Boundary radius.
            Uint32Array.BYTES_PER_ELEMENT + // Radius scale (8 bit), BVH end offset (24 bit).
            Uint32Array.BYTES_PER_ELEMENT + // BVH begin offset.
            BYTES_PER_ELEMENT + // Unknown vector.
            hullsLength +
            pointsLength +
            nodesLength
        )
    }

    *[Symbol.iterator](): Generator<Node> {
        if (!this.root) return

        const queue = [this.root]
        let node

        while ((node = queue.pop())) {
            if (node.right) queue.push(node.right)
            if (node.left) queue.push(node.left)

            yield node
        }
    }

    /** Lists all hulls referenced in nodes. */
    *listHulls(): Generator<Hull> {
        for (const node of this) if (node.hull) yield node.hull
    }

    /**
     * Reads main surfaces block.
     * Contains center of mass, linear drag, hulls, points and node BSP tree.
     * @param view
     */
    read(view: BufferReader): void {
        const size = view.readUint32()
        const startOffset = view.offset

        this.center = readVector(view)
        this.linearDrag = readVector(view)

        this.radius = view.readFloat32()

        const header = view.readUint32()
        this.radiusScale = (header && 0xff) / 0xfa

        const nodesEndOffset = startOffset + (header >> 8)
        const nodesStartOffset = startOffset + view.readInt32()

        this.unknown = readVector(view)

        const queue: [offset: number, parent?: Node][] = [[nodesStartOffset]]

        let pointsOffset = 0

        // Read nodes.
        while (queue.length) {
            const [offset, parent] = queue.pop()!

            if (offset < nodesStartOffset || offset > nodesEndOffset)
                throw new RangeError('Surface part node offset is out of bounds')

            view.offset = offset

            let rightOffset = view.readInt32()
            let hullOffset = view.readInt32()

            if (rightOffset) rightOffset += offset
            if (hullOffset) hullOffset += offset

            const node = new Node()
            node.read(view)

            if (!parent) this.root = node
            else {
                if (!parent.left) parent.left = node
                else if (!parent.right) parent.right = node
            }

            const leftOffset = view.offset

            // Read hull.
            if (hullOffset) {
                pointsOffset = (view.offset = hullOffset) + view.readInt32()
                ;(node.hull = new Hull()).read(view)
            }

            if (!node.hull || node.hull.flags === 5) {
                if (rightOffset) queue.push([rightOffset, node])
                if (leftOffset) queue.push([leftOffset, node])
            }
        }

        if (!pointsOffset) throw new RangeError('Invalid offset to points.')

        view.offset = pointsOffset

        // Read points.
        while (view.offset < nodesStartOffset) {
            const point = new Point()
            point.read(view)
            this.points.push(point)
        }

        // Move to end.
        view.offset = startOffset + size
    }

    write(view: BufferWriter): void {
        const { root } = this

        if (!root) throw new Error('Surfaces section is missing root node')

        /** Points block start offset. */
        let pointsStartOffset = 0

        /** Nodes block start offset. */
        let nodesStartOffset = 0

        /** Nodes block end offset. */
        let nodesEndOffset = 0

        /** Start offset. */
        const startOffset = (view.offset += Uint32Array.BYTES_PER_ELEMENT) // Skip size.

        view.offset += BYTES_PER_ELEMENT // Skip center.
        view.offset += BYTES_PER_ELEMENT // Skip linear drag.
        view.offset += Float32Array.BYTES_PER_ELEMENT // Skip radius.
        view.offset += Uint32Array.BYTES_PER_ELEMENT * 2 // Skip header and node begin offset.
        view.offset += BYTES_PER_ELEMENT // Skip unknown vector.

        const hulls = new Map<Hull, number>()

        // Write hulls.
        for (const hull of this.listHulls()) {
            hulls.set(hull, view.offset)

            view.offset += Int32Array.BYTES_PER_ELEMENT
            view.writeUint32(hull.flags)
            hull.write(view)
        }

        pointsStartOffset = view.offset

        // Write points.
        for (const point of this.points) point.write(view)

        nodesStartOffset = view.offset

        // Update hulls with relative offsets to pointsBegin and nodesBegin.
        for (const [hull, offset] of hulls) {
            view.offset = offset

            view.writeInt32(pointsStartOffset - offset)
            if (hull.flags === 5) view.writeInt32(nodesStartOffset - offset)
        }

        view.offset = nodesStartOffset

        // Write nodes.
        const queue: [number, Node][] = [[0, root]]

        while (queue.length > 0) {
            const [parentOffset, node] = queue.pop()!
            const offset = view.offset

            // Update parent offset.
            if (parentOffset > 0) view.setInt32(parentOffset, offset - parentOffset, view.littleEndian)

            view.writeInt32(0) // Offset to right child.
            view.writeInt32(node.hull ? (hulls.get(node.hull) ?? 0) - offset : 0) // Offset to hull.
            node.write(view)

            if (node.right) queue.push([offset, node.right])
            if (node.left) queue.push([0, node.left])
        }

        nodesEndOffset = view.offset

        view.offset = startOffset - Uint32Array.BYTES_PER_ELEMENT
        view.writeUint32(nodesEndOffset - startOffset)

        writeVector(view, this.center)
        writeVector(view, this.linearDrag)

        view.writeFloat32(this.radius)
        view.writeUint32((this.radiusScale * 0xfa) | ((nodesEndOffset - startOffset) << 8))
        view.writeUint32(nodesStartOffset - startOffset)

        writeVector(view, this.unknown)
    }
}
