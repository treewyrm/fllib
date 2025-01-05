import { getResourceId } from '../../hash/index.js'
import ResourceMap from '../../resourcemap.js'
import AnimatedColorProperty from './property/animatedColor.js'
import AnimatedCurveProperty from './property/animatedCurve.js'
import AnimatedFloatProperty from './property/animatedFloat.js'
import BlendProperty from './property/blend.js'
import BooleanProperty from './property/boolean.js'
import FloatProperty from './property/float.js'
import IntegerProperty from './property/integer.js'
import StringProperty from './property/string.js'
import TransformProperty from './property/transform.js'
import { NodeType } from './types.js'

/** List of known property types. */
export const properties = [
    BooleanProperty,
    IntegerProperty,
    FloatProperty,
    StringProperty,
    BlendProperty,
    TransformProperty,
    AnimatedFloatProperty,
    AnimatedColorProperty,
    AnimatedCurveProperty,
] as const

interface NodeTemplate {
    /** Parent template to extend from. */
    extends?: string

    /** Exclude these properties from resulting node. */
    exclude?: (string | number)[]

    /** List of properties used by node template. */
    properties: {
        [key: string]: () => InstanceType<(typeof properties)[number]>
    }
}

export const templateMap = new Map<NodeType, NodeTemplate>([
    [
        'FxNode',
        {
            properties: {
                Node_Name: () => new StringProperty('node'),
                Node_LifeSpan: () => new FloatProperty(Infinity),
                Node_Transform: () => new TransformProperty(),
            },
        },
    ],
    [
        'FxEmitter',
        {
            extends: 'FxNode',
            properties: {
                Emitter_EmitCount: () => new AnimatedCurveProperty(),
                Emitter_Frequency: () => new AnimatedCurveProperty(10),
                Emitter_InitialParticles: () => new IntegerProperty(0),
                Emitter_InitLifeSpan: () => new AnimatedCurveProperty(1),
                Emitter_LODCurve: () => new AnimatedFloatProperty(),
                Emitter_MaxParticles: () => new AnimatedCurveProperty(),
                Emitter_Pressure: () => new AnimatedCurveProperty(),
                Emitter_VelocityApproach: () => new AnimatedCurveProperty(),
            },
        },
    ],
    [
        'FxCubeEmitter',
        {
            extends: 'FxEmitter',
            properties: {
                CubeEmitter_Width: () => new AnimatedCurveProperty(100),
                CubeEmitter_Depth: () => new AnimatedCurveProperty(100),
                CubeEmitter_Height: () => new AnimatedCurveProperty(100),
                CubeEmitter_MinSpread: () => new AnimatedCurveProperty(0),
                CubeEmitter_MaxSpread: () => new AnimatedCurveProperty(15),
            },
        },
    ],
    [
        'FxSphereEmitter',
        {
            extends: 'FxEmitter',
            properties: {
                SphereEmitter_MinRadius: () => new AnimatedCurveProperty(0),
                SphereEmitter_MaxRadius: () => new AnimatedCurveProperty(100),
            },
        },
    ],
    [
        'FxConeEmitter',
        {
            extends: 'FxEmitter',
            properties: {
                ConeEmitter_MinRadius: () => new AnimatedCurveProperty(0),
                ConeEmitter_MaxRadius: () => new AnimatedCurveProperty(100),
                ConeEmitter_MinSpread: () => new AnimatedCurveProperty(0),
                ConeEmitter_MaxSpread: () => new AnimatedCurveProperty(22.5),
            },
        },
    ],
    [
        'FxAppearance',
        {
            extends: 'FxNode',
            properties: {
                Appearance_LODCurve: () => new AnimatedFloatProperty(),
            },
        },
    ],
    [
        'FxBasicAppearance',
        {
            extends: 'FxAppearance',
            properties: {
                BasicApp_TriTexture: () => new BooleanProperty(false),
                BasicApp_QuadTexture: () => new BooleanProperty(true),
                BasicApp_MotionBlur: () => new BooleanProperty(false),
                BasicApp_Color: () => new AnimatedColorProperty(),
                BasicApp_Alpha: () => new AnimatedFloatProperty(),
                BasicApp_Size: () => new AnimatedFloatProperty(),
                BasicApp_HToVAspect: () => new AnimatedFloatProperty(),
                BasicApp_Rotate: () => new AnimatedFloatProperty(),
                BasicApp_TexName: () => new StringProperty(),
                BasicApp_BlendInfo: () => new BlendProperty(),
                BasicApp_UseCommonTexFrame: () => new BooleanProperty(false),
                BasicApp_TexFrame: () => new AnimatedFloatProperty(),
                BasicApp_CommonTexFrame: () => new AnimatedCurveProperty(),
                BasicApp_FlipTexU: () => new BooleanProperty(false),
                BasicApp_FlipTexV: () => new BooleanProperty(false),
            },
        },
    ],
    [
        'FLDustAppearance',
        {
            extends: 'FxBasicAppearance',
            properties: {},
        },
    ],
    [
        'FxOrientedAppearance',
        {
            extends: 'FxBasicAppearance',
            properties: {
                OrientedApp_Width: () => new AnimatedFloatProperty(),
                OrientedApp_Height: () => new AnimatedFloatProperty(),
            },
        },
    ],
    [
        'FxParticleAppearance',
        {
            extends: 'FxAppearance',
            properties: {
                ParticleApp_LifeName: () => new StringProperty(),
                ParticleApp_DeathName: () => new StringProperty(),
                ParticleApp_UseDynamicRotation: () => new BooleanProperty(),
                ParticleApp_SmoothRotation: () => new BooleanProperty(),
            },
        },
    ],
    [
        'FxMeshAppearance',
        {
            extends: 'FxAppearance',
            properties: {
                MeshApp_MeshId: () => new IntegerProperty(),
                MeshApp_MeshName: () => new StringProperty(),
                MeshApp_UseParticleTransform: () => new BooleanProperty(),
                MeshApp_ParticleTransform: () => new TransformProperty(),
            },
        },
    ],
    [
        'FxRectAppearance',
        {
            extends: 'FxBasicAppearance',
            exclude: [
                'BasicApp_TriTexture',
                'BasicApp_QuadTexture',
                'BasicApp_Size',
                'BasicApp_HtoVAspect',
                'BasicApp_Rotate',
            ],
            properties: {
                RectApp_CenterOnPos: () => new BooleanProperty(),
                RectApp_ViewingAngleFade: () => new BooleanProperty(),
                RectApp_Scale: () => new AnimatedFloatProperty(),
                RectApp_Length: () => new AnimatedFloatProperty(),
                RectApp_Width: () => new AnimatedFloatProperty(),
            },
        },
    ],
    [
        'FxPerpAppearance',
        {
            extends: 'FxRectAppearance',
            exclude: ['RectApp_CenterOnPos', 'RectApp_Scale', 'RectApp_Length', 'RectApp_Width'],
            properties: {
                BasicApp_Size: () => new AnimatedFloatProperty(),
            },
        },
    ],
    [
        'FLBeamAppearance',
        {
            extends: 'FxRectAppearance',
            exclude: ['RectApp_CenterOnPos', 'RectApp_ViewingAngleFade'],
            properties: {
                BeamApp_DisablePlaceHolder: () => new BooleanProperty(),
                BeamApp_DupeFirstParticle: () => new BooleanProperty(),
                BeamApp_LineAppearance: () => new BooleanProperty(),
            },
        },
    ],
    [
        'FxRadialField',
        {
            properties: {
                RadialField_Radius: () => new AnimatedCurveProperty(),
                RadialField_Attenuation: () => new AnimatedFloatProperty(),
                RadialField_Magnitude: () => new AnimatedCurveProperty(),
                RadialField_Approach: () => new AnimatedCurveProperty(),
            },
        },
    ],
    [
        'FxGravityField',
        {
            properties: {
                GravityField_Gravity: () => new AnimatedCurveProperty(),
            },
        },
    ],
    [
        'FxCollideField',
        {
            properties: {
                CollideField_Reflectivity: () => new AnimatedCurveProperty(),
                CollideField_Width: () => new AnimatedCurveProperty(),
                CollideField_Height: () => new AnimatedCurveProperty(),
            },
        },
    ],
    [
        'FxTurbulenceField',
        {
            properties: {
                TurbulenceField_Magnitude: () => new AnimatedCurveProperty(),
                TurbulenceField_Approach: () => new AnimatedCurveProperty(),
            },
        },
    ],
    [
        'FxAirField',
        {
            properties: {
                AirField_Magnitude: () => new AnimatedCurveProperty(),
                AirField_Approach: () => new AnimatedCurveProperty(),
            },
        },
    ],
    [
        'FLDustField',
        {
            properties: {
                SphereEmitter_MaxRadius: () => new AnimatedCurveProperty(),
            },
        },
    ],
    [
        'FLBeamField',
        {
            properties: {},
        },
    ],
])

// Memorize properties.
;[...templateMap.values()].forEach(({ properties }) =>
    Object.keys(properties).forEach((value) => ResourceMap.names.set(getResourceId(value, true), value))
)

// This property is likely called something else.
ResourceMap.names.set(0x1c65b7b9, 'BeamApp_LineAppearance')
ResourceMap.names.set(0x03503b61, 'BeamApp_DupeFirstParticle')
ResourceMap.names.set(0x0abe0402, 'BeamApp_DisablePlaceHolder')
