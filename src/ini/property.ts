import Value, { toBoolean, toInteger, toFloat, toString } from './value.js'

export default class Property {
    /** Property position in text ini (line number) or binary ini (byte offset). */
    position = 0

    /** Property comment after semicolon delimiter. */
    comment?: string

    constructor(
        public name: string,
        public values: Value[] = [] // Keep it as array for easier order maintenance.
    ) {}

    /**
     * Get boolean value at index.
     * @param index 
     * @returns 
     */
    getBooleanAt(index: number) {
        return toBoolean(this.values.at(index))
    }

    /**
     * Set boolean value at index.
     * @param value 
     * @param index 
     */
    setBooleanAt(value: unknown, index: number) {
        this.values[index] = toBoolean(value)
    }

    /**
     * Get signed integer value at index.
     * @param index 
     * @returns 
     */
    getIntegerAt(index: number) {
        return toInteger(this.values.at(index))
    }

    /**
     * Set signed integer value at index.
     * @param value 
     * @param index 
     */
    setIntegerAt(value: unknown, index: number) {
        this.values[index] = toInteger(value)
    }

    /**
     * Get float value at index.
     * @param index 
     * @returns 
     */
    getFloatAt(index: number) {
        return toFloat(this.values.at(index))
    }

    /**
     * Set float value at index.
     * @param value 
     * @param index 
     */
    setFloatAt(value: unknown, index: number) {
        this.values[index] = toFloat(value)
    }

    /**
     * Get string value at index.
     * @param index 
     * @returns 
     */
    getStringAt(index: number) {
        return toString(this.values.at(index))
    }

    /**
     * Set string value at index.
     * @param value 
     * @param index 
     */
    setStringAt(value: unknown, index: number) {
        this.values[index] = toString(value)
    }

    get integerArray(): number[] {
        return this.values.map(toInteger)
    }

    set integerArray(values: unknown[]) {
        this.values = values.map(toInteger)
    }

    get floatArray(): number[] {
        return this.values.map(toFloat)
    }

    set floatArray(values: unknown[]) {
        this.values = values.map(toFloat)
    }

    get stringArray(): string[] {
        return this.values.map(toString)
    }

    set stringArray(values: unknown[]) {
        this.values = values.map(toString)
    }

    [Symbol.iterator]() {
        return this.values.values()
    }
}