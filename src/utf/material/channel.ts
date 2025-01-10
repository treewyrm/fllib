export enum Flags {
    None = 0,
    MirrorU = 1 << 0, // gl.TEXTURE_WRAP_S -> gl.MIRRORED_REPEAT
    ClampU = 1 << 1, // gl.TEXTURE_WRAP_S -> gl.CLAMP_TO_EDGE
    MirrorV = 1 << 2, // gl.TEXTURE_WRAP_T -> gl.MIRRORED_REPEAT
    ClampV = 1 << 3, // gl.TEXTURE_WRAP_T -> gl.CLAMP_TO_EDGE
    Unknown0 = 1 << 4, // Appears widely, uncertain
}
