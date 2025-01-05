import {
    type ReadsDirectory,
    type WritesDirectory,
    type ReadableDirectory,
    type WritableDirectory,
} from '../../types.js'
import Channel from './channel.js'

export default class ObjectMap implements ReadsDirectory, WritesDirectory {
    readonly kind = 'directory'

    parent = ''
    channel = new Channel()

    read(parent: ReadableDirectory): void {
        ;[this.parent = ''] = parent.getFile('Parent name')?.readStrings() ?? []
        this.channel = parent.read(new Channel()) ?? new Channel()
    }

    write(parent: WritableDirectory): void {
        parent.setFile('Parent name').writeStrings(this.parent)
        parent.write(this.channel)
    }
}
