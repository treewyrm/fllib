import { PathLike } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Get file listing in asynchronous generator.
 * @param pathname Folder path
 * @param deep List recursively
 */
export async function* listFiles(pathname: PathLike, deep = true): AsyncGenerator<string> {
    const queue = [pathname]

    let dirname: PathLike

    while (queue.length > 0)
        for (const entry of await readdir((dirname = queue.shift()!), { withFileTypes: true }))
            if (deep && entry.isDirectory()) queue.push(path.join(dirname.toString(), entry.name))
            else if (entry.isFile()) yield path.relative(pathname.toString(), path.join(dirname.toString(), entry.name))
}
