import Prismatic from './prismatic.js'
import { type Keyframe, at } from '../../../math/animation.js'
import { Quaternion, Scalar } from '../../../math/index.js'

export default class Revolute extends Prismatic {
    static readonly filename: string = 'Rev'

    rotationAt(time: number, keyframes: Keyframe<number>[]) {
        if (!keyframes.length) return this.rotation
        return Quaternion.multiply(Quaternion.axisAngle(this.axis, Scalar.linear(...at(keyframes, time))), this.rotation)
    }
}
