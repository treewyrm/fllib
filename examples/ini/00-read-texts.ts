import path from 'node:path'
import { read, names, texts } from 'fllib/info'
import { readFile } from 'node:fs/promises'
import { createReadStream, PathLike } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { Section, Text } from 'fllib/ini'

/**
 * Reads infocards from path.
 * @param file Freelancer ini path
 * @returns
 */
export async function readInfocards(pathname: string) {
    pathname = path.join(pathname, 'EXE')
    
    const resources = ['resources.dll']

    for (const section of await readINI(path.join(pathname, 'Freelancer.ini'))) {
        if (section.name !== 'Resources') continue

        for (const property of section.properties) {
            if (property.name !== 'DLL') continue

            const [name] = property.values

            if (typeof name === 'string') resources.push(name)
        }
    }

    for (const filename of resources) {
        const file = await readFile(path.join(pathname, filename))
        read(file.buffer)
    }

    return { names, texts }
}

export async function readINI(path: PathLike): Promise<Generator<Section>> {
    const reader = createInterface(createReadStream(path))
    const lines: string[] = []

    for await (const line of reader) lines.push(line)

    return Text.read(lines)
}
