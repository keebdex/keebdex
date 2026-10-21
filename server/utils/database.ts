import { createError } from 'h3'
import type {
  Database,
  TablesInsert,
  TablesUpdate,
} from '~/types/database.types'
import { TABLE_FIELDS } from './table-fields.generated'

type PublicTable = keyof Database['public']['Tables']

export type TableField<T extends PublicTable> = Extract<
  keyof TablesInsert<T> | keyof TablesUpdate<T>,
  string
>

function getAllowedTableFields<T extends PublicTable>(table: T) {
  const tableFields = TABLE_FIELDS[table] as unknown as readonly TableField<T>[]

  if (!tableFields.length) {
    throw createError({
      statusCode: 500,
      statusMessage: `No database field metadata found for ${table}`,
    })
  }

  return tableFields
}

/**
 * Picks only the allowed fields for a given table from the provided body object.
 * @param table The name of the table to pick fields from
 * @param body The object containing potential fields to pick
 * @param omit Columns of the table a client must never write, e.g. page keys
 * the database builds (`maker_sculpt_id`, `profile_keyset_id`,
 * `brand_keyboard_slug`)
 * @returns An object containing only the allowed fields for the specified table
 */
export function pickTableFields<T extends PublicTable>(
  table: T,
  body: unknown,
  omit: readonly string[] = [],
) {
  const allowedFields = getAllowedTableFields(table)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must be an object',
    })
  }

  const payload = body as Record<string, unknown>

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) =>
        value !== undefined &&
        allowedFields.includes(key as TableField<T>) &&
        !omit.includes(key),
    ),
  ) as Partial<Record<TableField<T>, unknown>>
}
