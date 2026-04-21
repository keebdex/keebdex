import omit from 'lodash.omit'

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

/**
 * Get a random cover image from a list of variants: prefer img_front, else img_back, else null
 * @param variants Array of variant objects with img_front/img_back
 * @returns string|null
 */
export function getRandomCoverImage(variants: any[]): string | null {
  const fronts = variants.map((v) => v.img_front).filter(Boolean)
  const backs = variants.map((v) => v.img_back).filter(Boolean)
  const pool = fronts.length ? fronts : backs
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
}
