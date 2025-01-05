import { type BufferReader, type BufferWriter } from '../../buffer/types.js'
import { getResourceId, type Hashable } from '../../hash/index.js'
import ResourceMap from '../../resourcemap.js'
import { TypeList } from '../../types.js'
import FloatProperty from './property/float.js'
import StringProperty from './property/string.js'
import TransformProperty from './property/transform.js'
import { getStringLength, readString, writeString } from './string.js'
import { properties, templateMap } from './template.js'
import { NodeType, PropertyName } from './types.js'

type NodeProperty = InstanceType<(typeof properties)[number]>

type PropertyMap = TypeList<(typeof properties)[number]>

let nodeCount = 0

const getType = (property: NodeProperty): number => {
    if ('type' in property.constructor && typeof property.constructor.type === 'number')
        return property.constructor.type

    throw new RangeError('Property has no type in constructor')
}

const getTypeName = (property: NodeProperty): string => {
    if ('typeName' in property.constructor && typeof property.constructor.typeName === 'string')
        return property.constructor.typeName

    throw new RangeError()
}

/** Node is a collection of static and dynamic property entires and a given type. */
export default class Node extends ResourceMap<NodeProperty> {
    constructor(
        /**
         * Node type.
         * @example 'FxBasicAppearance'
         */
        public type: NodeType = 'FxNode',

        /** Node name. */
        name = `node_#${(++nodeCount)}`
    ) {
        super()

        this.name = name
        this.lifespan = Infinity
        this.transform
    }

    get byteLength() {
        return (
            getStringLength(this.type) + // Node type string.
            Array.from(this.values()).reduce(
                (length, { byteLength }) =>
                    length +
                    Uint16Array.BYTES_PER_ELEMENT + // Property type.
                    Uint32Array.BYTES_PER_ELEMENT + // Property crc.
                    byteLength, // Property value.
                0
            ) + // Properties.
            Uint16Array.BYTES_PER_ELEMENT // Null property.
        )
    }

    create<T extends keyof PropertyMap>(type: T, name: PropertyName): InstanceType<PropertyMap[T]> {
        const Property = properties.find(({ type: value }) => value === type)
        if (!Property) throw new RangeError(`Unknown node property type ${type}`)

        const property = new Property()
        this.set(name, property)

        return property as InstanceType<PropertyMap[T]>
    }

    has(key: Hashable): boolean {
        return super.has(key, true)
    }

    get(key: Hashable): NodeProperty | undefined {
        return super.get(key, true)
    }

    set(key: Hashable, value: NodeProperty): this {
        return super.set(key, value, true)
    }

    delete(key: Hashable): boolean {
        return super.delete(key, true)
    }

    /**
     * Gets node name.
     * Node name is stored as "Node_Name" string property.
     */
    get name() {
        const property = this.get('Node_Name')
        return property instanceof StringProperty ? property.value : ''
    }

    /**
     * Sets node name.
     */
    set name(value: string) {
        ResourceMap.names.set(getResourceId(value, true), value)
        this.set('Node_Name', new StringProperty(value))
    }

    /**
     * Gets node lifespan.
     */
    get lifespan() {
        const property = this.get('Node_LifeSpan')
        return property instanceof FloatProperty ? property.value : 0
    }

    /**
     * Sets node lifespan.
     */
    set lifespan(value: number) {
        this.set('Node_LifeSpan', new FloatProperty(value))
    }

    /**
     * Gets transform (automatically creates and assigns one).
     */
    get transform() {
        let property = this.get('Node_Transform')
        if (!property) this.set('Node_Transform', (property = new TransformProperty()))
        return property
    }

    read(input: BufferReader) {
        this.type = readString(input)

        /** Property type. */
        let type = 0

        while ((type = input.readUint16() & 0x7fff)) {
            const Property = properties.find(({ type: value }) => value === type)
            if (!Property) throw new RangeError(`Unknown node property type ${type}`)

            const nodeId = input.readUint32()
            const property = new Property()
            property.read(input)

            this.set(nodeId, property)
        }
    }

    write(output: BufferReader & BufferWriter) {
        writeString(output, this.type)

        for (const [name, property] of this) {
            output.writeUint16(getType(property))
            output.writeUint32(getResourceId(name, true))

            property.write(output)
        }

        // Write null property to end property list.
        output.writeUint16(0)
    }

    /**
     * Initialize new node from template.
     * @param type 
     * @param name 
     * @returns 
     */
    static initialize(type: NodeType, name: string) {
        const node = new Node(type)
        const parents = new Set<string>()
        const exclude = new Set<string | number>()
    
        do {
            const template = templateMap.get(type)
            if (!template) break
    
            for (const [name, init] of Object.entries(template.properties)) node.set(name, init())
            for (const name of template.exclude ?? []) exclude.add(name)
    
            if (!template.extends) break
    
            if (parents.has(template.extends))
                throw new RangeError(`Node template ${type} has recursive extend: ${template.extends}`)
            type = template.extends
    
            parents.add(template.extends)
        } while (type)
    
        for (const name of exclude) node.delete(name)
    
        node.name = name
        return node
    }

    toJSON() {
        return {
            type: this.type,
            properties: Object.fromEntries([...this.objects()].map(([key, property]) => [key, {
                kind: getTypeName(property),
                value: property,
            }]))
        }
    }
}
