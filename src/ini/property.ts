import Value from './value.js'

/**
 * Property block contains one or more values.
 * 
 * - Property can contain maximum 255 values.
 * - In text INI property line is limited to 1024 bytes (including name and whitespace) and values are separated by comma.
 * - Empty values in text INI default to single boolean value of true.
 */
export default interface Property {
    /** Property name. */
    name: string

    /** Property values (bool, int32, float32, string). */
    values: Value[]

    /** Property line position from text INI or byte offset from binary INI. */
    position?: number

    /** Property comment from text INI. */
    comment?: string
}
