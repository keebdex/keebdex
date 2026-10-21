import { createError } from 'h3'
import { groupBy } from 'es-toolkit'
import type { getActorProfile } from './admin'
import { omitSensitive } from './index'
import { TABLE_FIELDS } from './table-fields.generated'
import {
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
    select: 'maker_sculpt_id, name',
  },
  keyset: {
    table: 'keysets',
    key: 'profile_keyset_id',
    select: 'profile_keyset_id, name, profile:keyset_profiles(name)',
  },
  keyboard: {
    table: 'keyboards',
    key: 'brand_keyboard_slug',
    select: 'brand_keyboard_slug, name',
  },
} as const

// Joined rows per record kind, for its name.
const RECORD_JOINS: Partial<Record<SuggestionEntityType, string>> = {
  keyset_kit: 'category:kit_categories(name)',
  keyset: 'profile:keyset_profiles(name)',
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

export const parentName = (domain: string, parent: any) => {
  if (!parent) return null

  return domain === 'keyset'
    ? [parent.profile?.name, parent.name].filter(Boolean).join(' ')
    : parent.name
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
        .select(['*', RECORD_JOINS[type]].filter(Boolean).join(', '))
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
        !['artisan_sculpt', 'keyset', 'keyboard'].includes(row.entity_type),
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

    return {
      ...row,
      record,
      entity_name: recordName(type, record),
      parent_name: parentName(
        row.domain,
        parents.get(`${row.domain}:${row.parent_key}`),
      ),
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
