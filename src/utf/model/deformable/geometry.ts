import { type VectorLike } from '../../../math/vector.js'
import {
    type WritableDirectory,
    type WritesDirectory,
    type ReadableDirectory,
    type ReadsDirectory,
} from '../../types.js'
import { pointsToBuffer, readPoints, readUVs, uvsToBuffer } from './utility.js'

export default class Geometry implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'

    pointIndices: number[] = []
    points: VectorLike[] = []
    normals: VectorLike[] = []

    uv0Indices: number[] = []
    uv0: [u: number, v: number][] = []

    uv1Indices: number[] = []
    uv1: [u: number, v: number][] = []

    pointBoneFirst: number[] = []
    pointBoneCount: number[] = []
    boneIndexChain: number[] = []
    boneWeightChain: number[] = []

    deltaUMin = 0
    deltaUMax = 0
    deltaVMin = 0
    deltaVMax = 0

    boneXUScale = 1
    boneYVScale = 1

    uvVertexCount = 0
    uvBoneIds: number[] = []
    uvVertexIds: number[] = []
    uvDefaults: number[] = []
    uvPlaneDistance = 0

    read(parent: ReadableDirectory): void {
        // Points and normals.
        this.pointIndices = [...(parent.getFile('Point_indices')?.readIntegers() ?? [])]
        this.points = readPoints(parent.getFile('Points')?.view!)
        this.normals = readPoints(parent.getFile('Vertex_normals')?.view!)

        // Texture map 0.
        this.uv0Indices = [...(parent.getFile('UV0_indices')?.readIntegers() ?? [])]
        if (this.uv0Indices.length > 0) {
            const file = parent.getFile('UV0')
            if (!file) throw new Error('Deformable mesh is missing UV0')
            
            this.uv0 = readUVs(file.view)
        }

        // Texture map 1.
        this.uv1Indices = [...(parent.getFile('UV1_indices')?.readIntegers() ?? [])]
        if (this.uv1Indices.length > 0) {
            const file = parent.getFile('UV1')
            if (!file) throw new Error('Deformable mesh is missing UV1')

            this.uv1 = readUVs(file.view)
        }

        // Bones and weights.
        this.pointBoneFirst = [...(parent.getFile('Point_bone_first')?.readIntegers() ?? [])]
        this.pointBoneCount = [...(parent.getFile('Point_bone_count')?.readIntegers() ?? [])]
        this.boneIndexChain = [...(parent.getFile('Bone_id_chain')?.readIntegers() ?? [])]
        this.boneWeightChain = [...(parent.getFile('Bone_weight_chain')?.readFloats() ?? [])]

        // Texture deltas.
        ;[this.deltaUMin = 0] = parent.getFile('min_du')?.readFloats() ?? []
        ;[this.deltaUMax = 0] = parent.getFile('max_du')?.readFloats() ?? []
        ;[this.deltaVMin = 0] = parent.getFile('min_dv')?.readFloats() ?? []
        ;[this.deltaVMax = 0] = parent.getFile('max_dv')?.readFloats() ?? []
        
        ;[this.boneXUScale = 1] = parent.getFile('bone_x_to_u_scale')?.readFloats() ?? []
        ;[this.boneYVScale = 1] = parent.getFile('bone_y_to_v_scale')?.readFloats() ?? []

        ;[this.uvVertexCount = 0] = parent.getFile('uv_vertex_count')?.readIntegers() ?? []
        this.uvBoneIds = [...(parent.getFile('uv_bone_id')?.readIntegers() ?? [])]
        this.uvVertexIds = [...(parent.getFile('uv_vertex_id')?.readIntegers() ?? [])]

        // TODO: uv_default_list is likely a list of [number, number]

        this.uvDefaults = [...(parent.getFile('uv_default_list')?.readFloats() ?? [])]
        ;[this.uvPlaneDistance = 0] = parent.getFile('uv_plane_distance')?.readFloats() ?? []
    }

    write(parent: WritableDirectory): void {
        // Points and normals.
        parent.setFile('Point_indices').writeIntegers(...this.pointIndices)
        parent.setFile('Points', pointsToBuffer(this.points))
        parent.setFile('Vertex_normals', pointsToBuffer(this.normals))

        // Texture map 0.
        if (this.uv0Indices.length > 0) {
            parent.setFile('UV0_indices').writeIntegers(...this.uv0Indices)
            parent.setFile('UV0', uvsToBuffer(this.uv0))
        }

        // Texture map 1.
        if (this.uv1Indices.length > 0) {
            parent.setFile('UV1_indices').writeIntegers(...this.uv1Indices)
            parent.setFile('UV1', uvsToBuffer(this.uv1))
        }

        // Bones and weights.
        parent.setFile('Point_bone_first').writeIntegers(...this.pointBoneFirst)
        parent.setFile('Point_bone_count').writeIntegers(...this.pointBoneCount)
        parent.setFile('Bone_id_chain').writeIntegers(...this.boneIndexChain)
        parent.setFile('Bone_weight_chain').writeFloats(...this.boneWeightChain)

        // Texture deltas.
        if (this.deltaUMin !== 0) parent.setFile('min_du').writeFloats(this.deltaUMin)
        if (this.deltaUMax !== 0) parent.setFile('max_du').writeFloats(this.deltaUMax)
        if (this.deltaVMin !== 0) parent.setFile('min_dv').writeFloats(this.deltaVMin)
        if (this.deltaVMax !== 0) parent.setFile('max_dv').writeFloats(this.deltaVMax)

        if (this.boneXUScale !== 1) parent.setFile('bone_x_to_u_scale').writeFloats(this.boneXUScale)
        if (this.boneYVScale !== 1) parent.setFile('bone_y_to_v_scale').writeFloats(this.boneYVScale)

        if (this.uvVertexCount > 0) parent.setFile('uv_vertex_count').writeIntegers(this.uvVertexCount)
        if (this.uvBoneIds.length > 0) parent.setFile('uv_bone_id').writeIntegers(...this.uvBoneIds)
        if (this.uvVertexIds.length > 0) parent.setFile('uv_vertex_id').writeIntegers(...this.uvVertexIds)
        if (this.uvDefaults.length > 0) parent.setFile('uv_default_list').writeFloats(...this.uvDefaults)
        
        if (this.uvPlaneDistance !== 0) parent.setFile('uv_plane_distance').writeFloats(this.uvPlaneDistance)
    }
}
