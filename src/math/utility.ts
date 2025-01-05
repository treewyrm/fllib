/**
 * Convert horizontal field of vision to vertical.
 * @param angle Horizontal field of vision (radians)
 * @param ratio Viewport aspect ratio
 */
export const fovXtoY = (angle: number, ratio: number): number => 2 * Math.atan((1 / ratio) * Math.tan(angle * 0.5))

/**
 * Convert vertical field of vision to horizontal.
 * @param angle Vertical field of vision angle (radians)
 * @param ratio Viewport aspect ratio
 */
export const fovYtoX = (angle: number, ratio: number): number => 2 * Math.atan(ratio * Math.tan(angle * 0.5))

/**
 * Calculate distance from sphere center for camera to fit or cover it on viewport.
 * Uses horizontal fov if ratio is less than one, otherwise vertical fov.
 * @param fov Vertical field of view (radians)
 * @param ratio Viewport aspect ratio (width / height)
 * @param radius Sphere radius
 * @param fit Fit or cover boundary sphere
 */
export const getViewDistance = (fov: number, ratio: number, radius: number, fit: boolean): number => {
    fov *= 0.5 // Take half the field of view
    return radius / Math.sin((fit && ratio < 1) || (!fit && ratio >= 1) ? Math.atan(ratio * Math.tan(fov)) : fov)
}
