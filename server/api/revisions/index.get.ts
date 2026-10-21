import { createError, defineEventHandler, getQuery } from 'h3'
import {
  REVISION_COLUMNS,
  requireRevisionStaff,
  revisionsTable,
  withParentNames,
  withRevisionActors,
} from '../../utils/revisions'
import { REVISION_SOURCE_GROUPS, isRevisionSourceGroup } from '~/utils/revisions'
import { isSuggestionEntityType } from '~/utils/suggestions'

const DOMAINS = ['artisan', 'keyset', 'keyboard']
const PAGE_SIZE = 50

/**
 * Revisions, newest first, without their snapshots. `before` (a revision id)
 * pages to older ones; RLS keeps them to the caller's scope.
 * - `domain` + `parent_key`: History of a sculpt, keyset or keyboard page,
 *   the parent record and its children; `entity_type` + `entity_id` narrow it
 *   to one record.
 * - No `parent_key`: Recent Changes, every page of the caller's scope (or one
 *   `domain`), each revision with its page's name (`parent_name`).
 * - `source` (`editors`, `suggestions`, `syncs`) and `hide_syncs=1` filter by
 *   who made the change.
 */
export default defineEventHandler(async (event) => {
  const { client } = await requireRevisionStaff(event)
  const {
    domain,
    parent_key,
    entity_type,
    entity_id,
    source,
    hide_syncs,
    before,
    limit,
  } = getQuery(event)

  if (domain !== undefined && !DOMAINS.includes(String(domain))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid domain' })
  }

  if (parent_key !== undefined && (typeof parent_key !== 'string' || !parent_key || !domain)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid parent key' })
  }

  if (source !== undefined && !isRevisionSourceGroup(source)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid source' })
  }

  const size = Math.min(Math.max(Number(limit) || 20, 1), PAGE_SIZE)

  let query = revisionsTable(client)
    .select(REVISION_COLUMNS)
    .order('id', { ascending: false })
    .limit(size + 1)

  if (domain) query = query.eq('domain', domain)
  if (parent_key) query = query.eq('parent_key', parent_key)

  if (entity_type !== undefined || entity_id !== undefined) {
    const id = Number(entity_id)

    if (!isSuggestionEntityType(entity_type) || !Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid record' })
    }

    query = query.eq('entity_type', entity_type).eq('entity_id', id)
  }

  if (isRevisionSourceGroup(source)) {
    query = query.in('source', REVISION_SOURCE_GROUPS[source])
  } else if (hide_syncs === '1' || hide_syncs === 'true') {
    query = query.not('source', 'in', `(${REVISION_SOURCE_GROUPS.syncs.join(',')})`)
  }

  if (before !== undefined && before !== '') {
    const cursor = Number(before)

    if (!Number.isInteger(cursor) || cursor <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid cursor' })
    }

    query = query.lt('id', cursor)
  }

  const { data, error } = await query

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const rows = data || []
  let page = await withRevisionActors(client, rows.slice(0, size))

  if (!parent_key) page = await withParentNames(client, page)

  return { data: page, hasMore: rows.length > size }
})
