import Library from '../library.js'
import { type ReadableDirectory } from '../types.js'
import Material from './material.js'
import DetailMaterial from './detail.js'
import GlassMaterial from './glass.js'
import NebulaMaterial from './nebula.js'
import NomadMaterial from './nomad.js'
import SinglePassMaterial from './singlepass.js'
import { type InstanceList, type TypeArrayList } from '../../types.js'
import { findInMap, getResourceId } from '../../hash/index.js'

const types = [SinglePassMaterial, DetailMaterial, NebulaMaterial, NomadMaterial, GlassMaterial] as const

/** Maps types in materials  */
// type MaterialMap = TypeList<InstanceType<typeof types[number]>>

type MaterialMap = InstanceList<TypeArrayList<typeof types[number]>>

/** Matching name patterns override material type. */
const namePatterns = new Map<RegExp, keyof MaterialMap>()

namePatterns.set(/^null$/, 'NullMaterial')
namePatterns.set(/^sea_anim.*$/, 'PlanetWaterMaterial')
namePatterns.set(/^anim_hud.*$/, 'HUDAnimMaterial')
namePatterns.set(/^o_glass$/, 'HighGlassMaterial')
namePatterns.set(/^bw_glass$/, 'HighGlassMaterial')
namePatterns.set(/^planet.*_glass$/, 'GFGlassMaterial')
namePatterns.set(/^r_glass$/, 'HighGlassMaterial')
namePatterns.set(/^l_glass$/, 'HighGlassMaterial')
namePatterns.set(/^k_glass$/, 'HighGlassMaterial')
namePatterns.set(/^b_glass$/, 'HighGlassMaterial')
namePatterns.set(/^cv_glass$/, 'HighGlassMaterial')
namePatterns.set(/^c_glass$/, 'HighGlassMaterial')
namePatterns.set(/^exclusion_.*/, 'ExclusionZoneMaterial')
namePatterns.set(/^ui_.*/, 'HUDIconMaterial')
namePatterns.set(/^n-texture.*$/, 'NomadMaterial')
namePatterns.set(/^nomad.*$/, 'NomadMaterial')
namePatterns.set(/^tlr_energy$/, 'NebulaTwo')
namePatterns.set(/^tlr_material$/, 'NebulaTwo')
namePatterns.set(/^detailmap_.*/, 'BtDetailMapMaterial')
namePatterns.set(/^alpha_mask.*2side/, 'DcDtTwo')
namePatterns.set(/^alpha_mask.*/, 'DcDt')

/** Matching type string override material type. */
const typeReplacements = new Map<string, keyof MaterialMap>()

typeReplacements.set('EcEtOcOt', 'DcDtOcOt')
typeReplacements.set('DcDtEcEt', 'DcDtEt')

export default class MaterialLibrary extends Library<Material> {
    readonly filename = 'Material Library'

    static readonly types = types

    /**
     * Creates new material by specified type.
     * @param type Case insensitive material type
     * @returns
     */
    static createMaterial<T extends keyof MaterialMap>(value: T): MaterialMap[T] {
        const replacement = findInMap(typeReplacements, value)
        if (replacement) value = replacement as T

        const search = getResourceId(value)

        for (const Material of this.types) {
            const type = Material.types.find((type) => getResourceId(type) === search)
            if (!type) continue

            const material = new Material()
            material.type = type
            return material as MaterialMap[T]
        }

        throw new RangeError(`Unknown material type: ${value}`)
    }

    create(parent: ReadableDirectory, name: string): Material | null {
        let [type] = parent.getFile('Type')?.readStrings() ?? []
        
        // Name pattern overrides type.
        for (const [pattern, replacement] of namePatterns)
            if (pattern.test(name.toLowerCase())) {
                type = replacement
                break
            }

        if (!type) return null

        try {
            return MaterialLibrary.createMaterial(type as keyof MaterialMap)
        } catch (error) {
            console.warn(error)
            return null
        }
    }

    /**
     * Create material by type.
     * @param type
     */
    createMaterial<T extends keyof MaterialMap>(type: T, name: string): MaterialMap[T] {
        const material = MaterialLibrary.createMaterial(type)
        this.set(name, material)
        return material
    }
}

export { SinglePassMaterial, DetailMaterial, GlassMaterial, NebulaMaterial, NomadMaterial }