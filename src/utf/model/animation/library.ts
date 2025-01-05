import { type ReadableDirectory, type WritableDirectory } from '../../types.js'
import Library from '../../library.js'
import Script from './script.js'

export default class Animation extends Library<Script> {
    create(): Script {
        return new Script()
    }

    read(parent: ReadableDirectory): void {
        const script = parent.getDirectory('Script')
        if (!script) return

        super.read(script)
    }

    write(parent: WritableDirectory): void {
        super.write(parent.setDirectory('Script'))
    }
}
