import omit from 'lodash.omit'

/**
 * Pick only the fields that are defined in the database table to prevent unexpected fields from being inserted
 * @param tableName
 * @param data
 * @returns
 */
export { pickTableFields } from './database'

/**
 * Omit sensitive fields from the object before sending it to the client
 * @param obj
 * @returns
 */
export const omitSensitive = (obj: any) => omit(obj, ['fts'])

/**
 * Convert a value to a number or null if it's not a valid number
 * @param value
 * @returns
 */
export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(parsed) ? null : parsed
}
