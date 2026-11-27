import { createError } from 'h3'
import type {
  Database,
  TablesInsert,
  TablesUpdate,
} from '~/types/database.types'
import { TABLE_FIELDS } from './table-fields.generated'
import { z } from 'zod'

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

const httpUrl = z.httpUrl()

/** The link and image columns of `table` whose value in `payload` is not an http(s) URL. */
const invalidUrlColumns = (table: string, payload: Record<string, unknown>) =>
  Object.keys(URL_COLUMNS[table] ?? {}).filter((column) => {
    const value = payload[column]

    // Empty values (null, blank) are allowed; they clear the column.
    if (value === undefined || value === null) return false
    if (typeof value === 'string' && !value.trim()) return false

    return !httpUrl.safeParse(value).success
  })

const urlError = (table: string, column: string) =>
  createError({
    statusCode: 400,
    statusMessage: `${URL_COLUMNS[table]![column]} must be an http(s) URL`,
  })

/**
 * Rejects (400) a non-http(s) value in a link or image column of `table`.
 * For inserts and edit suggestions, which carry new values only.
 */
export function assertHttpUrlFields(
  table: string,
  payload: Record<string, unknown>,
) {
  const [column] = invalidUrlColumns(table, payload)

  if (column) throw urlError(table, column)
}

/**
 * The same check for an update of the row matching `match`. Forms send every
 * field back, and older rows may hold values that are not http(s) URLs (e.g.
 * `www.example.com`), so a value equal to the stored one is not re-checked:
 * editing another field of such a record still saves. Reads the row only
 * when the payload has an invalid value.
 */
export async function assertHttpUrlChanges(
  client: { from: (table: any) => any },
  table: string,
  payload: Record<string, unknown>,
  match: Record<string, unknown>,
) {
  const invalid = invalidUrlColumns(table, payload)

  if (!invalid.length) return

  const { data: stored } = await client
    .from(table)
    .select(invalid.join(', '))
    .match(match)
    .maybeSingle()

  const column = invalid.find((name) => payload[name] !== stored?.[name])

  if (column) throw urlError(table, column)
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

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) =>
        value !== undefined &&
        allowedFields.includes(key as TableField<T>) &&
        !GENERATED_FIELDS.includes(key) &&
        !omit.includes(key),
    ),
  ) as Partial<Record<TableField<T>, unknown>>
}
