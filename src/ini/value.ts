type Value = string | number | boolean

export { type Value as default }

/** Convert a value to boolean. */
export const toBoolean = (value: unknown) => {
    switch (typeof value) {
        case 'boolean':
            return value
        case 'number':
            return !!value
        case 'string':
            return !/^false|0$/i.test(value.trim())
        default:
            return false
    }
}

/** Convert a value to integer. */
export const toInteger = (value: unknown) => {
    switch (typeof value) {
        case 'boolean':
            return value ? 1 : 0
        case 'number':
            return Math.round(value)
        case 'string':
            return parseInt(value, 10)
        default:
            return 0
    }
}

/** Convert a value to float. */
export const toFloat = (value: unknown) => {
    switch (typeof value) {
        case 'boolean':
            return value ? 1.0 : 0.0
        case 'number':
            return Math.fround(value)
        case 'string':
            return Math.fround(parseFloat(value))
        default:
            return 0
    }
}

/** Convert a value to string. */
export const toString = (value: unknown) => {
    switch (typeof value) {
        case 'boolean':
            return value ? 'true' : 'false'
        case 'number':
            return value.toString(10)
        case 'string':
            return value
        default:
            return ''
    }
}

type Type = 'boolean' | 'integer' | 'float' | 'string'

type TypeValue<T extends Type> = T extends 'boolean'
    ? boolean
    : T extends 'integer' | 'float'
      ? number
      : T extends 'string'
        ? string
        : never

type Last<T extends any[]> = T extends [...any[], infer V] ? V : never

type ValuesFrom<T extends Type[]> = [
    ...{
        [K in keyof T]: TypeValue<T[K]>
    },
    ...TypeValue<Last<T>>[],
]

/**
 * Cast value into type.
 * @param value
 * @param type
 * @returns
 */
export const cast = <T extends Type>(value: unknown, type: T): TypeValue<T> => {
    switch (type) {
        case 'boolean':
            return toBoolean(value) as TypeValue<T>
        case 'integer':
            return toInteger(value) as TypeValue<T>
        case 'float':
            return toFloat(value) as TypeValue<T>
        case 'string':
            return toString(value) as TypeValue<T>
        default:
            throw new TypeError(`Invalid cast type`)
    }
}

/**
 * Cast values to specific types.
 * Last type listed will be used for remaining values in property.
 * @param values Sequence of input values
 * @param types Sequence of desired output types
 * @returns
 */
export const format = <T extends Type[]>(values: Value[], ...types: [...T]): ValuesFrom<T> => {
    const length = Math.max(values.length, types.length)
    let result = new Array<Value>(length)

    for (let i = 0; i < length; i++) result[i] = cast(values[i], types[Math.min(i, types.length - 1)])

    return result as ValuesFrom<T>
}
