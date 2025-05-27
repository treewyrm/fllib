import { type ReadableDirectory, type WritableDirectory } from '../types.js'
import VMeshPart from './vmeshpart.js'

const Switch2 = 'Switch2'

export default class MultiLevel {
    readonly kind = 'directory'

    constructor(
        public levels: VMeshPart[] = [],
        public ranges: number[] = []
    ) {}

    atRange(value: number) {
        for (let i = 0, l = this.ranges.length - 1, min: number, max: number; i < l; i++) {
            min = this.ranges[i] ?? 0
            max = this.ranges[i + 1] ?? Infinity

            if (value >= min && value < max) return this.levels[i]
        }

        return
    }

    read(parent: ReadableDirectory) {
        this.levels = []
        this.ranges = [...(parent.getFile(Switch2)?.readFloats() ?? [0, 1000])]

        for (let index = 0; ; index++) {
            const level = parent.getDirectory(`Level${index}`)
            if (!level) break

            const part = level.read(new VMeshPart())
            if (!part) throw new Error(`Missing part in level ${index}`)

            this.levels[index] = part
        }
    }

    write(parent: WritableDirectory) {
        if (this.ranges.length) parent.setFile(Switch2).writeFloats(...this.ranges)
        for (const [index, part] of this.levels.entries()) parent.setDirectory(`Level${index}`).write(part)
    }

    toJSON() {
        return {
            kind: 'switch2',
            ranges: this.ranges,
        }
    }
}
