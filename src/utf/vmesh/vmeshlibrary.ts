import Library from '../library.js'
import { ReadableDirectory } from '../types.js'
import VMesh from './vmesh.js'
import VMeshRef from './vmeshref.js'
import VWireData from './vwiredata.js'

export default class VMeshLibrary extends Library<VMesh> {
    create(parent: ReadableDirectory): VMesh | null {
        return parent.getFile('VMeshData') ? new VMesh() : null
    }

    /**
     * Get draw object by wireframe reference.
     * @param reference
     * @returns
     */
    getWireframeDraw(reference: VWireData) {
        const { meshId, indices: elements, vertexStart, vertexCount } = reference

        const { data } = this.get(meshId) ?? {}
        if (!data) throw new RangeError(`Mesh ${meshId} not found.`)

        const { format, vertexSize: size } = data
        const vertices = data.getVertexBufferRange(vertexStart, vertexCount)

        return {
            elements,
            format,
            size,
            vertices,
        }
    }

    /**
     * Get draw object by mesh reference.
     * @param reference
     */
    *getMeshDraw(reference: VMeshRef) {
        const { meshId, groupStart, groupCount, indexStart } = reference

        const { data } = this.get(meshId) ?? {}
        if (!data) throw new RangeError(`Mesh ${meshId} not found.`)

        const { primitive, format, vertexSize: size } = data
        let base = indexStart

        for (let g = 0; g < groupCount; g++) {
            const group = data.groups.at(g + groupStart)
            if (!group) throw new RangeError(`Missing mesh group ${g + groupStart} in mesh ${meshId}`)

            const elements = data.indices.subarray(base, base + group.elementCount)
            const vertices = data.getVertexBufferRange(group.vertexStart, group.vertexCount)

            yield {
                materialId: group.materialId,
                primitive,
                base,
                elements,
                format,
                size,
                vertices,
            }

            base += group.elementCount
        }
    }
}
