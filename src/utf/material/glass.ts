import Material from './material.js';
import { type TypesOf } from '../../types.js';

export default class GlassMaterial extends Material {
    static readonly types = ['GlassMaterial', 'GFGlassMaterial', 'HighGlassMaterial'] as const

    type: TypesOf<typeof GlassMaterial> = 'GlassMaterial'
}