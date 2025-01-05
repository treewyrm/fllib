import { type Readable, type Writable } from '../../buffer/types.js'
import { Animation } from '../../math/index.js'

export type Keyframe<T> = Animation.Keyframe<T>

/** An object with keyframes. */
export interface KeyframeProperty<T> {
    /** Array of keyframes. Should be sorted. */
    keyframes: Keyframe<T>[]
}

/** A readable/writable static value object. */
export interface Property<T> extends Readable, Writable {
    /** Static value. */
    value: T
}

/** An animated value property. */
export interface AnimatedProperty<T, K = T> extends Property<T>, KeyframeProperty<KeyframeProperty<K>> {
    /** Last evaluated value. */
    readonly value: T

    /**
     * Evaluate animation.
     * @param parameter External parameter.
     * @param time Time.
     */
    at(parameter: number, time: number): T
}

/** Known node types. */
export type NodeType =
    | 'FxNode'
    | 'FxCubeEmitter'
    | 'FxSphereEmitter'
    | 'FxConeEmitter'
    | 'FxBasicAppearance'
    | 'FLDustAppearance'
    | 'FxOrientedAppearance'
    | 'FxParticleAppearance'
    | 'FxMeshAppearance'
    | 'FxRectAppearance'
    | 'FxPerpAppearance'
    | 'FLBeamAppearance'
    | 'FxRadialField'
    | 'FxCollideField'
    | 'FxTurbulenceField'
    | 'FxAirField'
    | 'FLDustField'
    | 'FLBeamField'
    | (string & {})

/** Known node property names. */
export type PropertyName =
    | 'Node_Name'
    | 'Node_LifeSpan'
    | 'Node_Transform'
    | 'Emitter_EmitCount'
    | 'Emitter_Frequency'
    | 'Emitter_InitialParticles'
    | 'Emitter_InitLifeSpan'
    | 'Emitter_LODCurve'
    | 'Emitter_MaxParticles'
    | 'Emitter_Pressure'
    | 'Emitter_VelocityApproach'
    | 'CubeEmitter_Width'
    | 'CubeEmitter_Depth'
    | 'CubeEmitter_Height'
    | 'CubeEmitter_MinSpread'
    | 'CubeEmitter_MaxSpread'
    | 'SphereEmitter_MinRadius'
    | 'SphereEmitter_MaxRadius'
    | 'ConeEmitter_MinRadius'
    | 'ConeEmitter_MaxRadius'
    | 'ConeEmitter_MinSpread'
    | 'ConeEmitter_MaxSpread'
    | 'Appearance_LODCurve'
    | 'BasicApp_TriTexture'
    | 'BasicApp_QuadTexture'
    | 'BasicApp_MotionBlur'
    | 'BasicApp_Color'
    | 'BasicApp_Alpha'
    | 'BasicApp_Size'
    | 'BasicApp_HToVAspect'
    | 'BasicApp_Rotate'
    | 'BasicApp_TexName'
    | 'BasicApp_BlendInfo'
    | 'BasicApp_UseCommonTexFrame'
    | 'BasicApp_TexFrame'
    | 'BasicApp_CommonTexFrame'
    | 'BasicApp_FlipTexU'
    | 'BasicApp_FlipTexV'
    | 'OrientedApp_Width'
    | 'OrientedApp_Height'
    | 'ParticleApp_LifeName'
    | 'ParticleApp_DeathName'
    | 'ParticleApp_UseDynamicRotation'
    | 'ParticleApp_SmoothRotation'
    | 'MeshApp_MeshId'
    | 'MeshApp_MeshName'
    | 'MeshApp_UseParticleTransform'
    | 'MeshApp_ParticleTransform'
    | 'RectApp_CenterOnPos'
    | 'RectApp_ViewingAngleFade'
    | 'RectApp_Scale'
    | 'RectApp_Length'
    | 'RectApp_Width'
    | 'BeamApp_DisablePlaceHolder'
    | 'BeamApp_DupeFirstParticle'
    | 'BeamApp_LineAppearance'
    | 'RadialField_Radius'
    | 'RadialField_Attenuation'
    | 'RadialField_Magnitude'
    | 'RadialField_Approach'
    | 'GravityField_Gravity'
    | 'CollideField_Reflectivity'
    | 'CollideField_Width'
    | 'CollideField_Height'
    | 'TurbulenceField_Magnitude'
    | 'TurbulenceField_Approach'
    | 'AirField_Magnitude'
    | 'AirField_Approach'
    | 'SphereEmitter_MaxRadius'
    | (string & {})
