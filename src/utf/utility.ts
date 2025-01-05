import { type DirectoryObject, type FileObject } from './types.js'
import { type BufferWriter, type BufferReader } from '../buffer/types.js'
import { type MatrixLike } from '../math/matrix.js'
import { type VectorLike } from '../math/vector.js'
import { type QuaternionLike } from '../math/quaternion.js'

/**
 * Gets preferred UTF object directory or file name.
 * @param value Object representing directory or file
 * @returns
 */
export const getObjectFilename = (value: DirectoryObject | FileObject): string =>
    value.filename ?? value.constructor.name

/** Reads vector from buffer. */
export const readVector = (view: BufferReader): VectorLike => ({
    x: view.readFloat32(),
    y: view.readFloat32(),
    z: view.readFloat32(),
})

/** Writes vector into buffer. */
export const writeVector = (view: BufferWriter, { x, y, z }: VectorLike): void => {
    view.writeFloat32(x)
    view.writeFloat32(y)
    view.writeFloat32(z)
}

/** Reads quaternion from buffer. */
export const readQuaternion = (view: BufferReader): QuaternionLike => ({
    w: view.readFloat32(),
    x: view.readFloat32(),
    y: view.readFloat32(),
    z: view.readFloat32(),
})

/** Writes quaternion into buffer. */
export const writeQuaternion = (view: BufferWriter, { w, x, y, z }: QuaternionLike): void => {
    view.writeFloat32(w)
    view.writeFloat32(x)
    view.writeFloat32(y)
    view.writeFloat32(z)
}

/** Reads matrix from buffer. */
export const readMatrix = (view: BufferReader): MatrixLike => ({
    x: readVector(view),
    y: readVector(view),
    z: readVector(view),
})

/** Writes matrix into buffer. */
export const writeMatrix = (view: BufferWriter, { x, y, z }: MatrixLike): void => {
    writeVector(view, x)
    writeVector(view, y)
    writeVector(view, z)
}
