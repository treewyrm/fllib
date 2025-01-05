import { type VectorLike, BYTES_PER_ELEMENT } from '../../math/vector.js'

/** Texture UV coordinate tuple. */
export type UV = [u: number, v: number]

export type Attributes = {
    position?: VectorLike
    size?: number
    normal?: VectorLike
    diffuse?: number
    specular?: number
    uv1?: UV
    uv2?: UV
    uv3?: UV
    uv4?: UV
    uv5?: UV
    uv6?: UV
    uv7?: UV
    uv8?: UV
}

export const VertexFormat = {
    Position: 0x02,
    Normal: 0x10,
    PointSize: 0x20,
    Diffuse: 0x40,
    Specular: 0x80,
    TextureCountMask: 0xf00,
    TextureCountShift: 8,
} as const

/** Direct3D flexible vertex format (FVF). */
export enum Format {
    /** Vertex position `D3DFVF_XYZ` */
    Position = 0x02,

    /** Vertex normal `D3DFVF_NORMAL` */
    Normal = 0x10,

    /** Vertex point size `D3DFVF_PSIZE` */
    PointSize = 0x20,

    /** Vertex diffuse color `D3DFVF_DIFFUSE` */
    Diffuse = 0x40,

    /** Vertex specular color `D3DFVF_SPECULAR` */
    Specular = 0x80,

    /** Texture UVs count mask. */
    TextureCountMask = 0xf00,

    /** Texture UVs count shift. */
    TextureCountShift = 8,

    /** Vertex UV1 `D3DFVF_TEX1` */
    Texture1 = 0x100,

    /** Vertex UV2 `D3DFVF_TEX2` */
    Texture2 = 0x200,

    /** Vertex UV3 `D3DFVF_TEX3` */
    Texture3 = 0x300,

    /** Vertex UV4 `D3DFVF_TEX4` */
    Texture4 = 0x400,

    /** Vertex UV5 `D3DFVF_TEX5` */
    Texture5 = 0x500,

    /** Vertex UV6 `D3DFVF_TEX6` */
    Texture6 = 0x600,

    /** Vertex UV7 `D3DFVF_TEX7` */
    Texture7 = 0x700,

    /** Vertex UV8 `D3DFVF_TEX8` */
    Texture8 = 0x800,
}

/**
 * Calculates number of UV maps for the vertex format.
 * @param format FVF bitmask
 * @returns
 */
export const getMapCount = (format: Format) => (format & Format.TextureCountMask) >> Format.TextureCountShift

/**
 * Calculates vertex byte length for the vertex format.
 * @param format FVF bitmask
 * @returns
 */
export const getByteLength = (format: Format) => {
    let size = 0

    if (format & Format.Position) size += BYTES_PER_ELEMENT
    if (format & Format.PointSize) size += Float32Array.BYTES_PER_ELEMENT
    if (format & Format.Normal) size += BYTES_PER_ELEMENT
    if (format & Format.Diffuse) size += Uint32Array.BYTES_PER_ELEMENT
    if (format & Format.Specular) size += Uint32Array.BYTES_PER_ELEMENT

    size += Float32Array.BYTES_PER_ELEMENT * 2 * getMapCount(format)

    return size
}
