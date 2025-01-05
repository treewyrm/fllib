export type TypesOf<T> = T extends { types: infer V } ? (V extends readonly unknown[] ? V[number] : never) : never

export type WithType = {
    type: string | symbol | number
}

export type TypeList<T extends WithType> = {
    [V in T as V['type']]: V
}

export type WithTypeArray = {
    types: readonly (string | symbol)[]
}

export type TypeArrayList<T extends WithTypeArray> = {
    [V in T as V['types'][number]]: V
}

/**
 * Transforms map of constructors into map of instances.
 */
export type InstanceList<T extends { [key: string | number]: new (...args: unknown[]) => unknown }> = {
    [K in keyof T]: InstanceType<T[K]>
}