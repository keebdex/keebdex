import { createError } from 'h3'
import { groupBy, omit } from 'es-toolkit'
import type { getActorProfile } from './admin'
import { omitSensitive } from './index'
import { TABLE_FIELDS } from './table-fields.generated'
import {
  PAGE_ENTITY_TYPES,
  SUGGESTION_ENTITIES,
  isProtectedSuggestionField,
  normalizeSuggestionValue,
} from '~/utils/suggestions'
import type { SuggestionEntityType } from '~/utils/suggestions'
import { suggestionChangesSchema } from '~/utils/schemas/suggestion'

type SupabaseClient = Awaited<ReturnType<typeof getActorProfile>>['client']

// `edit_suggestions` and `apply_edit_suggestion` are not in the generated
// types until the migration is applied, so they go through an untyped handle.
export const suggestionsTable = (client: SupabaseClient) =>
  (client as any).from('edit_suggestions')

export const SUGGESTION_COLUMNS =
  'id, entity_type, entity_id, domain, scope, parent_key, changes, original, applied, reason, review_status, review_note, submitted_by, verified_at, created_at, updated_at'

/** First Zod issue as a 400 with a user-facing message. */
const invalid = (issues: { message: string; path: PropertyKey[] }[]) => {
  const [issue] = issues

  return createError({
    statusCode: 400,
    statusMessage: issue?.message || 'Invalid suggestion',
  })
}

/**
 * Validates the suggested values of a record: every key must be a column of
 * its table and not a protected one; blanks become null. Value types are
 * checked by the database (the guard trigger casts them to the table's row).
 */
export const parseSuggestionChanges = (
  type: SuggestionEntityType,
  changes: unknown,
) => {
  const result = suggestionChangesSchema.safeParse(changes)

  if (!result.success) throw invalid(result.error.issues)

  const { table } = SUGGESTION_ENTITIES[type]
  const columns = TABLE_FIELDS[table as keyof typeof TABLE_FIELDS] as
    | readonly string[]
    | undefined

  for (const key of Object.keys(result.data)) {
    if (!columns?.includes(key) || isProtectedSuggestionField(type, key)) {
      throw createError({
        statusCode: 400,
        statusMessage: `The field "${key}" cannot be changed.`,
      })
    }
  }

  return Object.fromEntries(
    Object.entries(result.data).map(([key, value]) => [
      key,
      normalizeSuggestionValue(value),
    ]),
  )
}

/**
 * Maps database errors from the `edit_suggestions` guard trigger and
 * `apply_edit_suggestion()` to HTTP errors; their messages are written for
 * users.
 */
export const suggestionError = (error: { code?: string; message: string }) => {
  switch (error.code) {
    case '23505':
      return createError({
        statusCode: 409,
        statusMessage:
          'You already have a pending suggestion for this record. Edit it instead.',
      })
    case '23503':
    case 'P0002':
      return createError({ statusCode: 404, statusMessage: error.message })
    case '23514':
    case '22023':
    case '22P02':
    case '22007':
    case '22008':
    case '22003':
      return createError({ statusCode: 400, statusMessage: error.message })
    case '42501':
      return createError({ statusCode: 403, statusMessage: error.message })
    default:
      return createError({ statusCode: 500, statusMessage: error.message })
  }
}

export const PARENT_LOOKUPS = {
  artisan: {
    table: 'artisan_sculpts',
    key: 'maker_sculpt_id',
    select: 'maker_sculpt_id, name, maker:artisan_makers(name)',
  },
  keyset: {
    table: 'keysets',
    key: 'profile_keyset_id',
    select: 'profile_keyset_id, name, profile:keyset_profiles(name)',
  },
  keyboard: {
    table: 'keyboards',
    key: 'brand_keyboard_slug',
    select: 'brand_keyboard_slug, name, brand:keyboard_brands(name)',
  },
} as const

// Joined rows per record kind, for its name.
const RECORD_JOINS: Partial<Record<SuggestionEntityType, string>> = {
  keyset_kit: 'category:kit_categories(name)',
  keyset: 'profile:keyset_profiles(name)',
}

// Joined rows only for `names` (what the Edits queue lists), dropped from
// `record` afterwards so forms and diffs see the record's own columns.
const NAME_JOINS: Partial<Record<SuggestionEntityType, [string, string]>> = {
  artisan_sculpt: ['maker', 'maker:artisan_makers(name)'],
  keyboard: ['brand', 'brand:keyboard_brands(name)'],
  keyboard_variant: ['release', 'release:keyboard_releases(name)'],
}

export interface SuggestionNames {
  // Maker, keyset profile, or keyboard brand.
  owner: string | null
  // Sculpt, keyset, or keyboard.
  page: string | null
  // Keyboard release (of a release or a variant).
  release: string | null
  // Colorway, kit, or variant; null for the page itself and releases.
  item: string | null
}

/**
 * The names of a suggestion's record by level, so the Edits queue can show
 * each module its own columns (Maker, Kit, Brand, Variant). A deleted record
 * keeps what its parent page gives.
 */
const suggestionNames = (
  type: SuggestionEntityType,
  record: any,
  parent: any,
): SuggestionNames => {
  const page = PAGE_ENTITY_TYPES.includes(type) ? record : parent
  const owner = page?.maker ?? page?.profile ?? page?.brand

  return {
    owner: owner?.name ?? null,
    page: page?.name ?? null,
    // Only keyboards have releases (sculpts have a `release` column of their own).
    release:
      type === 'keyboard_release'
        ? (record?.name ?? null)
        : type === 'keyboard_variant'
          ? (record?.release?.name ?? null)
          : null,
    item: ['artisan_colorway', 'keyset_kit', 'keyboard_variant'].includes(type)
      ? recordName(type, record)
      : null,
  }
}

const recordName = (type: SuggestionEntityType, record: any) => {
  if (!record) return null

  if (type === 'keyset') {
    return [record.profile?.name, record.name].filter(Boolean).join(' ')
  }

  if (type === 'keyset_kit') {
    return record.name || record.category?.name || record.kit_id
  }

  return record[SUGGESTION_ENTITIES[type].nameKey]
}

/**
 * A sculpt, keyset or keyboard page's name with what it belongs to, the way
 * the catalog shows it: `GAF Ninja`, `GMK Olivia`, `Singa Unikorn`.
 */
export const parentName = (parent: any) => {
  if (!parent) return null

  const owner = parent.maker ?? parent.profile ?? parent.brand

  return [owner?.name, parent.name].filter(Boolean).join(' ')
}

/**
 * Adds to each suggestion its record's current values (`record`), the
 * record's name (`entity_name`) and its parent's name (`parent_name`), with a
 * few small queries per page. A record deleted since has `record: null`.
 */
export const withSuggestionRecords = async (
  client: SupabaseClient,
  suggestions: any[],
) => {
  const db = client as any
  const records = new Map<string, any>()
  const parents = new Map<string, any>()

  const byType = groupBy(
    suggestions,
    (row) => row.entity_type as SuggestionEntityType,
  )

  await Promise.all(
    Object.entries(byType).map(async ([key, rows]) => {
      const type = key as SuggestionEntityType
      const entity = SUGGESTION_ENTITIES[type]
      const { data, error } = await db
        .from(entity.table)
        .select(
          ['*', RECORD_JOINS[type], NAME_JOINS[type]?.[1]]
            .filter(Boolean)
            .join(', '),
        )
        .in('id', [...new Set(rows.map((row) => row.entity_id))])

      if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
      }

      for (const record of data || []) {
        records.set(`${type}:${record.id}`, omitSensitive(record))
      }
    }),
  )

  // Sculpts, keysets and keyboards are their own parent.
  const byDomain = groupBy(
    suggestions.filter(
      (row) =>
        !PAGE_ENTITY_TYPES.includes(row.entity_type),
    ),
    (row) => row.domain as keyof typeof PARENT_LOOKUPS,
  )

  await Promise.all(
    Object.entries(byDomain).map(async ([key, rows]) => {
      const domain = key as keyof typeof PARENT_LOOKUPS
      const lookup = PARENT_LOOKUPS[domain]
      const { data, error } = await db
        .from(lookup.table)
        .select(lookup.select)
        .in(lookup.key, [...new Set(rows.map((row) => row.parent_key))])

      if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
      }

      for (const parent of data || []) {
        parents.set(`${domain}:${parent[lookup.key]}`, parent)
      }
    }),
  )

  return suggestions.map((row) => {
    const type = row.entity_type as SuggestionEntityType
    const record = records.get(`${type}:${row.entity_id}`) || null
    const parent = parents.get(`${row.domain}:${row.parent_key}`)
    const nameJoin = NAME_JOINS[type]?.[0]

    return {
      ...row,
      record: record && nameJoin ? omit(record, [nameJoin]) : record,
      entity_name: recordName(type, record),
      parent_name: parentName(parent),
      names: suggestionNames(type, record, parent),
    }
  })
}

/** The suggestion with the columns the endpoints check, or a 404. */
export const getSuggestion = async (client: SupabaseClient, id: unknown) => {
  const suggestionId = Number(id)

  if (!Number.isInteger(suggestionId) || suggestionId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid suggestion id' })
  }

  const { data, error } = await suggestionsTable(client)
    .select('id, entity_type, entity_id, scope, review_status, submitted_by')
    .eq('id', suggestionId)
    .maybeSingle()

  if (error) throw suggestionError(error)

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Suggestion not found' })
  }

  return data as {
    id: number
    entity_type: SuggestionEntityType
    entity_id: number
    scope: string
    review_status: 'Pending' | 'Approved' | 'Rejected'
    submitted_by: string
  }
}
