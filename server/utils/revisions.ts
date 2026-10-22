import { createError } from 'h3'
import { groupBy } from 'es-toolkit'
import type { H3Event } from 'h3'
import { getActorProfile } from './admin'
import { PARENT_LOOKUPS, parentName } from './edit-suggestions'
import { omitSensitive } from './index'
import { canManageAnyAssignment } from '~/utils/permissions'
import {
  SUGGESTION_ENTITIES,
  isSuggestionEntityType,
} from '~/utils/suggestions'

type SupabaseClient = Awaited<ReturnType<typeof getActorProfile>>['client']

// `record_revisions`, `revert_revision` and `revision_actors` are not in the
// generated types until the migration is applied, so they go through an
// untyped handle.
export const revisionsTable = (client: SupabaseClient) =>
  (client as any).from('record_revisions')

// `record_name` / `variant_name`: the record's own name at that revision,
// read from the snapshot, so lists under one page can drop the page's name.
export const REVISION_COLUMNS =
  'id, created_at, entity_type, entity_id, domain, scope, parent_key, label, action, changes, source, actor, suggestion_id, reverts_revision, run_id, record_name:snapshot->>name, variant_name:snapshot->>variant_name'

// Lists show no fields, so they leave out `changes` too.
export const REVISION_LIST_COLUMNS = REVISION_COLUMNS.replace(' changes,', '')

/**
 * Revision history is for staff only. RLS narrows what they read to their
 * scope (`can_manage(scope)`); this rejects everyone else up front.
 */
export const requireRevisionStaff = async (event: H3Event) => {
  const actor = await getActorProfile(event)

  if (!canManageAnyAssignment(actor.profile)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return actor
}

export const parseRevisionId = (id: unknown) => {
  const revisionId = Number(id)

  if (!Number.isInteger(revisionId) || revisionId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid revision id' })
  }

  return revisionId
}

/**
 * Maps database errors from `revert_revision()` to HTTP errors; their
 * messages are written for users. A conflicting undo (`RV409`) lists the
 * fields that changed again in `data.fields`.
 */
export const revisionError = (error: {
  code?: string
  message: string
  details?: string | null
}) => {
  switch (error.code) {
    case 'RV409':
      return createError({
        statusCode: 409,
        statusMessage: error.message,
        data: { fields: (error.details || '').split(',').filter(Boolean) },
      })
    case 'P0002':
      return createError({ statusCode: 404, statusMessage: error.message })
    case '23514':
    case '22023':
    case '22P02':
    case '23502':
    case '23503':
      return createError({ statusCode: 400, statusMessage: error.message })
    case '42501':
      return createError({ statusCode: 403, statusMessage: error.message })
    default:
      return createError({ statusCode: 500, statusMessage: error.message })
  }
}

/**
 * Adds `actor_name` / `actor_avatar` to each revision, and for applied
 * suggestions `suggested_by` with the submitter's name and avatar. Names come from
 * `revision_actors()`, since staff other than admins cannot read other users.
 */
export const withRevisionActors = async (
  client: SupabaseClient,
  revisions: any[],
) => {
  const db = client as any
  const suggestionIds = [
    ...new Set(revisions.map((row) => row.suggestion_id).filter(Boolean)),
  ]
  const submitters = new Map<number, string>()

  if (suggestionIds.length) {
    const { data, error } = await db
      .from('edit_suggestions')
      .select('id, submitted_by')
      .in('id', suggestionIds)

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    for (const row of data || []) submitters.set(row.id, row.submitted_by)
  }

  const ids = [
    ...new Set(
      [...revisions.map((row) => row.actor), ...submitters.values()].filter(
        Boolean,
      ),
    ),
  ]
  const actors = new Map<
    string,
    { name: string | null; avatar: string | null }
  >()

  if (ids.length) {
    const { data, error } = await db.rpc('revision_actors', { p_ids: ids })

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    for (const row of data || []) actors.set(row.id, row)
  }

  return revisions.map((row) => {
    const actor = row.actor ? actors.get(row.actor) : undefined
    const submitter = row.suggestion_id
      ? submitters.get(row.suggestion_id)
      : undefined

    return {
      ...row,
      actor_name: actor?.name ?? null,
      actor_avatar: actor?.avatar ?? null,
      suggested_by: submitter
        ? {
            id: submitter,
            name: actors.get(submitter)?.name ?? null,
            avatar: actors.get(submitter)?.avatar ?? null,
          }
        : null,
    }
  })
}

const PARENT_TYPES = ['artisan_sculpt', 'keyset', 'keyboard']

/**
 * Adds `parent_name` to each revision: the name of its sculpt, keyset or
 * keyboard page now, or, once that page is gone, the label of the page's own
 * revision when one is in the list.
 */
export const withParentNames = async (
  client: SupabaseClient,
  revisions: any[],
) => {
  const db = client as any
  const names = new Map<string, string | null>()
  const byDomain = groupBy(
    revisions.filter((row) => row.parent_key),
    (row) => row.domain as keyof typeof PARENT_LOOKUPS,
  )

  await Promise.all(
    Object.entries(byDomain).map(async ([key, rows]) => {
      const domain = key as keyof typeof PARENT_LOOKUPS
      const lookup = PARENT_LOOKUPS[domain]

      if (!lookup) return

      const { data, error } = await db
        .from(lookup.table)
        .select(lookup.select)
        .in(lookup.key, [...new Set(rows.map((row) => row.parent_key))])

      if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
      }

      for (const parent of data || []) {
        names.set(`${domain}:${parent[lookup.key]}`, parentName(parent))
      }
    }),
  )

  // Parent records are their own page.
  const ownLabels = new Map(
    revisions
      .filter((row) => PARENT_TYPES.includes(row.entity_type))
      .map((row) => [`${row.domain}:${row.parent_key}`, row.label]),
  )

  return revisions.map((row) => {
    const key = `${row.domain}:${row.parent_key}`

    return {
      ...row,
      parent_name: names.get(key) || ownLabels.get(key) || null,
    }
  })
}

/** The record a revision belongs to, as it is now, or null once deleted. */
export const getRevisionRecord = async (
  client: SupabaseClient,
  entityType: string,
  entityId: number,
) => {
  if (!isSuggestionEntityType(entityType)) return null

  const { data, error } = await (client as any)
    .from(SUGGESTION_ENTITIES[entityType].table)
    .select('*')
    .eq('id', entityId)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data ? omitSensitive(data) : null
}

/**
 * The record before a revision: nothing for an insert, the snapshot itself
 * for a delete (it holds the row as it was deleted), and for an update the
 * snapshot with the changed fields set back to their previous values.
 */
export const revisionBefore = (revision: {
  action: string
  snapshot: Record<string, unknown>
  changes: Record<string, [unknown, unknown]> | null
}) => {
  if (revision.action === 'insert') return null
  if (revision.action === 'delete') return revision.snapshot

  return {
    ...revision.snapshot,
    ...Object.fromEntries(
      Object.entries(revision.changes || {}).map(([key, [before]]) => [
        key,
        before,
      ]),
    ),
  }
}
