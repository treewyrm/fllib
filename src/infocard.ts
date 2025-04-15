import BufferView from './buffer/view.js'

const MZ = 0x5a4d
const PE = 0x00004550

enum ResourceType {
    String = 6,
    HTML = 23,
}

/** Text decoder (Freelancer stores strings as wide UTF-16LE) */
const decoder = new TextDecoder('utf-16')

/**
 * Get ASCII NUL-terminated string.
 * @param length
 */
function readString(array: ArrayBufferView, length?: number): string {
    const view = new Uint8Array(
        array.buffer,
        array.byteOffset,
        length ? Math.min(array.byteLength, length) : array.byteLength
    )
    const end = view.indexOf(0)

    return String.fromCharCode(...(end >= 0 ? view.subarray(0, end) : view))
}

type Section = {
    name: string
    virtualSize: number
    virtualAddress: number
    sizeOfRawData: number
    pointerToRawData: number
    pointerToRelocations: number
    pointerToLineNumbers: number
    numberOfRelocations: number
    numberOfLineNumbers: number
    characteristics: number
}

/**
 * List sections.
 * @param view
 * @returns
 */
function* listSections(view: BufferView): Generator<Section> {
    while (view.byteRemain) {
        yield {
            name: readString(view.slice(8)),
            virtualSize: view.readUint32(),
            virtualAddress: view.readUint32(),
            sizeOfRawData: view.readUint32(),
            pointerToRawData: view.readUint32(),
            pointerToRelocations: view.readUint32(),
            pointerToLineNumbers: view.readUint32(),
            numberOfRelocations: view.readUint16(),
            numberOfLineNumbers: view.readUint16(),
            characteristics: view.readUint32(),
        }
    }
}

type DirectoryEntry = {
    type: 'name' | 'id'
    value: number
    pointerToData: number
}

/**
 * List directory entries.
 * @param view
 * @param offset
 * @returns
 */
function* listDirectory(view: BufferView, offset = 0): Generator<DirectoryEntry> {
    view = view.subarray((offset & 0x7fffffff) + 12) // Skip characteristics, timedate, major and minor versions.

    const numberOfNamedEntries = view.readUint16()
    const numberOfIdEntries = view.readUint16()

    for (let i = 0; i < numberOfNamedEntries; i++)
        yield {
            type: 'name',
            value: view.readUint32(),
            pointerToData: view.readUint32(),
        }

    for (let i = 0; i < numberOfIdEntries; i++) {
        yield {
            type: 'id',
            value: view.readUint32(),
            pointerToData: view.readUint32(),
        }
    }
}

type LanguageBlock = {
    offsetToData: number
    size: number
    codePage: number
    reserved: number
}

/**
 * List language blocks.
 * @param view
 * @param offset
 * @returns
 */
function* listLanguageBlocks(view: BufferView, offset: number): Generator<LanguageBlock> {
    for (let { pointerToData } of listDirectory(view, offset)) {
        pointerToData &= 0x7fffffff

        view = view.subarray(pointerToData, pointerToData + Uint32Array.BYTES_PER_ELEMENT * 4)

        yield {
            offsetToData: view.readUint32(),
            size: view.readUint32(),
            codePage: view.readUint32(),
            reserved: view.readUint32(),
        }
    }
}

type StringIDBlock = LanguageBlock & {
    id: number
}

/**
 * List string entries
 * @param view
 * @param offset Offset to first string entry
 * @param codepage TODO: Filter by codepage
 */
function* listStrings(view: BufferView, offset: number): Generator<StringIDBlock> {
    for (let { value: id, pointerToData } of listDirectory(view, offset)) {
        for (const { offsetToData, size, codePage, reserved } of listLanguageBlocks(view, pointerToData))
            yield {
                id,
                offsetToData,
                size,
                codePage,
                reserved,
            }
    }
}

type PEHeader = {
    fourCC: number
    machine: number
    numberOfSections: number
    timeDateStamp: number
    pointerToSymbols: number
    numberOfSymbols: number
    sizeOfOptionalHeader: number
    characteristics: number
}

/**
 * Reads portable header.
 * @param view 
 * @returns 
 */
const readPEHeader = (view: BufferView): PEHeader => ({
    fourCC: view.readUint32(),
    machine: view.readUint16(),
    numberOfSections: view.readUint16(),
    timeDateStamp: view.readUint32(),
    pointerToSymbols: view.readUint32(),
    numberOfSymbols: view.readUint32(),
    sizeOfOptionalHeader: view.readUint16(),
    characteristics: view.readUint16(),
})

/** Text strings, typically referenced by `ids_name`. */
export const names = new Map<number, string>()

/** XML infocards, typically referenced by `ids_info`. */
export const texts = new Map<number, string>()

/** Load index. */
let fileIndex = 0

/**
 * Clear all names and texts, reset file index.
 */
export function reset() {
    names.clear()
    texts.clear()
    fileIndex = 0
}

/**
 * Loads text and html resources from DLL.
 *
 * Original game sequence of resources:
 * - resources.dll (implicitly loaded first)
 * - InfoCards.dll
 * - MiscText.dll
 * - NameResources.dll
 * - EquipResources.dll
 * - OfferBribeResources.dll
 * - MiscTextInfo2.dll
 *
 * Names and order are defined in freelancer.ini.
 *
 * @param input Byte buffer
 * @param index Resource index
 * @param texts Strings
 * @param cards Infocards
 */
export function read(input: ArrayBufferLike) {
    const idOffset = 0x10000 * fileIndex++
    const view = new BufferView(input)

    // Read DOS header.
    const signature = view.readUint16()
    if (signature !== MZ) throw new TypeError('Invalid DLL DOS header signature')

    // Jump to e_lfanew.
    view.offset = 60

    // Jump to portable executable header.
    view.offset = view.readUint32()

    const { fourCC, numberOfSections, sizeOfOptionalHeader } = readPEHeader(view)
    if (fourCC !== PE) throw new TypeError('Invalid DLL PE header signature')

    view.offset += sizeOfOptionalHeader // Skip optional header to section list.

    const sectionsView = view.subarray(view.offset, view.offset + numberOfSections * 40)

    // Find .rsrc section.
    for (let { name, pointerToRawData, sizeOfRawData } of listSections(sectionsView)) {
        if (name !== '.rsrc') continue

        const rawDataView = view.subarray(pointerToRawData, pointerToRawData + sizeOfRawData)

        for (let { type, value: id, pointerToData } of listDirectory(rawDataView)) {
            if (type !== 'id') continue

            switch (id) {
                case ResourceType.String:
                    for (let { id, offsetToData, size } of listStrings(rawDataView, pointerToData)) {
                        const block = view.subarray(offsetToData, offsetToData + size)
                        id = (id - 1) * 16

                        // Strings are stored in blocks of 16 entries.
                        for (let i = 0; i < 16; i++) {
                            const length = block.readUint16() * Uint16Array.BYTES_PER_ELEMENT
                            const buffer = new Uint8Array(block.buffer, block.byteOffset + block.offset, length)

                            names.set(idOffset + id + i, decoder.decode(buffer))
                            block.offset += length
                        }
                    }
                    break
                case ResourceType.HTML:
                    for (let { id, offsetToData, size } of listStrings(rawDataView, pointerToData))
                        texts.set(idOffset + id, decoder.decode(view.subarray(offsetToData, offsetToData + size)))

                    break
            }
        }

        break
    }
}
