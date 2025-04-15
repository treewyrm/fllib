import Prismatic from './prismatic.js'
import { type Keyframe, at } from '../../../math/animation.js'
import { Quaternion } from '../../../math/index.js'

export default class Revolute extends Prismatic {
    static readonly filename: string = 'Rev'

    rotationAt(time: number, keyframes: Keyframe<number>[]) {
        if (!keyframes.length) return this.rotation
        const [start, end, weight] = at(keyframes, time)

        return Quaternion.multiply(
            Quaternion.slerp(Quaternion.axisAngle(this.axis, start), Quaternion.axisAngle(this.axis, end), weight),
            this.rotation
        )
    }
}
