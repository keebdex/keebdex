import { createError, defineEventHandler, getQuery } from 'h3'
import {
  REVISION_LIST_COLUMNS,
  requireRevisionStaff,
  revisionsTable,
  withParentNames,
  withRevisionActors,
} from '../../utils/revisions'
import {
  REVISION_SOURCE_GROUPS,
  isRevisionSourceGroup,
  revisionGroupKey,
} from '~/utils/revisions'
import type { RevisionGrouping } from '~/utils/revisions'
import { isSuggestionEntityType } from '~/utils/suggestions'

const DOMAINS = ['artisan', 'keyset', 'keyboard']
const MAX_GROUPS = 50
// Rows read per request to the database, and the most requests per page, so
// a huge sync run cannot make one page read the whole table.
const BATCH_SIZE = 200
const MAX_BATCHES = 10

/**
 * Revisions, newest first, without their snapshots or changes, paged by
 * groups (`revisionGroupKey`): `groups` (default 20, at most 50) complete
 * groups per page, and `before` (a revision id, the last one returned) for
 * the next. RLS keeps them to the caller's scope.
 * - `domain` + `parent_key`: History of a sculpt, keyset or keyboard page,
 *   the parent record and its children, one revision per group;
 *   `entity_type` + `entity_id` narrow it to one record, `run_id` to one sync
 *   run.
 * - No `parent_key`: Recent Changes, every page of the caller's scope (or one
 *   `domain`), grouped by page, each revision with its page's name
 *   (`parent_name`).
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
    run_id,
    source,
    hide_syncs,
    before,
    groups,
  } = getQuery(event)

  if (domain !== undefined && !DOMAINS.includes(String(domain))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid domain' })
  }

  if (
    parent_key !== undefined &&
    (typeof parent_key !== 'string' || !parent_key || !domain)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid parent key' })
  }

  if (source !== undefined && !isRevisionSourceGroup(source)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid source' })
  }

  if (
    run_id !== undefined &&
    (typeof run_id !== 'string' || !run_id || run_id.length > 100)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid run' })
  }

  const recordId = Number(entity_id)

  if (
    (entity_type !== undefined || entity_id !== undefined) &&
    (!isSuggestionEntityType(entity_type) ||
      !Number.isInteger(recordId) ||
      recordId <= 0)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid record' })
  }

  let cursor: number | undefined

  if (before !== undefined && before !== '') {
    cursor = Number(before)

    if (!Number.isInteger(cursor) || cursor <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid cursor' })
    }
  }

  const size = Math.min(Math.max(Number(groups) || 20, 1), MAX_GROUPS)
  const grouping: RevisionGrouping = parent_key ? 'revision' : 'page'

  const batch = (below?: number) => {
    let query = revisionsTable(client)
      .select(REVISION_LIST_COLUMNS)
      .order('id', { ascending: false })
      .limit(BATCH_SIZE)

    if (domain) query = query.eq('domain', domain)
    if (parent_key) query = query.eq('parent_key', parent_key)
    if (run_id) query = query.eq('run_id', run_id)

    if (entity_type !== undefined) {
      query = query.eq('entity_type', entity_type).eq('entity_id', recordId)
    }

    if (isRevisionSourceGroup(source)) {
      query = query.in('source', REVISION_SOURCE_GROUPS[source])
    } else if (hide_syncs === '1' || hide_syncs === 'true') {
      query = query.not(
        'source',
        'in',
        `(${REVISION_SOURCE_GROUPS.syncs.join(',')})`,
      )
    }

    if (below) query = query.lt('id', below)

    return query
  }

  // Read until the page's last group is known to be complete: the first row
  // of the group after it, or the end of the table.
  const rows: any[] = []
  let exhausted = false

  // Groups are runs of consecutive rows with the same key, so a key can come
  // back later as a new group.
  const groupCount = () =>
    rows.filter(
      (row, index) =>
        !index ||
        revisionGroupKey(row, grouping) !==
          revisionGroupKey(rows[index - 1], grouping),
    ).length

  for (let index = 0; index < MAX_BATCHES; index++) {
    const { data, error } = await batch(rows.at(-1)?.id ?? cursor)

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    rows.push(...(data || []))
    exhausted = (data?.length || 0) < BATCH_SIZE

    if (exhausted || groupCount() > size) break
  }

  // Keep the first `size` groups (consecutive rows with the same key).
  let end = rows.length
  let seen = 0
  let previous: string | undefined

  for (let index = 0; index < rows.length; index++) {
    const key = revisionGroupKey(rows[index], grouping)

    if (key !== previous) {
      previous = key
      seen++

      if (seen > size) {
        end = index
        break
      }
    }
  }

  let page = await withRevisionActors(client, rows.slice(0, end))

  if (!parent_key) page = await withParentNames(client, page)

  return { data: page, hasMore: end < rows.length || !exhausted }
})
