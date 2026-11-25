import { createError } from 'h3'
import type {
  Database,
  TablesInsert,
  TablesUpdate,
} from '~/types/database.types'
import { TABLE_FIELDS } from './table-fields.generated'
import { isHttpUrl } from '~/utils/url'

export type PublicTable = keyof Database['public']['Tables']

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

// Link and image columns users can write. They end up in `href` and `src`,
// so they take http(s) URLs only (`javascript:` and `data:` URLs run script).
// Keyed by table: `users.discord` is a handle, not a link.
const URL_COLUMNS: Partial<Record<string, Record<string, string>>> = {
  artisan_makers: {
    website: 'Website',
    instagram: 'Instagram',
    discord: 'Discord',
    artisancollector: 'ArtisanCollector',
  },
  keyboard_brands: {
    website: 'Website',
    instagram: 'Instagram',
    discord: 'Discord',
  },
  artisan_colorways: { img: 'Image' },
  keyboard_variants: { img_front: 'Front image', img_back: 'Back image' },
  keyset_kits: { img: 'Image' },
  keysets: {
    url: 'URL',
    img: 'Image',
    order_graph: 'Order graph',
    order_history: 'Order history',
  },
  testimonials: { avatar_url: 'Avatar' },
}

/**
 * Rejects (400) a non-http(s) value in a link or image column of `table`.
 * Empty values (null, blank) are allowed; they clear the column.
 */
export function assertHttpUrlFields(
  table: string,
  payload: Record<string, unknown>,
) {
  const columns = URL_COLUMNS[table]
  if (!columns) return

  for (const [column, label] of Object.entries(columns)) {
    const value = payload[column]

    if (value === undefined || value === null) continue
    if (typeof value === 'string' && !value.trim()) continue

    if (!isHttpUrl(value)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${label} must be an http(s) URL`,
      })
    }
  }
}

// Generated columns, never written by anyone.
const GENERATED_FIELDS = ['fts']

/**
 * Picks only the allowed fields for a given table from the provided body object.
 * Generated columns (`fts`) are always left out.
 * @param table The name of the table to pick fields from
 * @param body The object containing potential fields to pick
 * @param omit Columns of the table a client must never write, e.g. page keys
 * the database builds (`maker_sculpt_id`, `profile_keyset_id`,
 * `brand_keyboard_slug`) or `MODERATION_FIELDS`
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

  const picked = Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) =>
        value !== undefined &&
        allowedFields.includes(key as TableField<T>) &&
        !GENERATED_FIELDS.includes(key) &&
        !omit.includes(key),
    ),
  ) as Partial<Record<TableField<T>, unknown>>

  assertHttpUrlFields(table, picked)

  return picked
}
