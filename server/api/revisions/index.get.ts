import { createError, defineEventHandler, getQuery } from 'h3'
import {
  REVISION_COLUMNS,
  requireRevisionStaff,
  revisionsTable,
  withRevisionActors,
} from '../../utils/revisions'

const DOMAINS = ['artisan', 'keyset', 'keyboard']
const PAGE_SIZE = 50

/**
 * History of a sculpt, keyset or keyboard page: revisions of the parent
 * record and of its children (`parent_key`), newest first, without their
 * snapshots. `before` (a revision id) pages to older ones. RLS keeps them to
 * the caller's scope.
 */
export default defineEventHandler(async (event) => {
  const { client } = await requireRevisionStaff(event)
  const { domain, parent_key, before, limit } = getQuery(event)

  if (!DOMAINS.includes(String(domain))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid domain' })
  }

  if (typeof parent_key !== 'string' || !parent_key) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid parent key' })
  }

  const size = Math.min(Math.max(Number(limit) || 20, 1), PAGE_SIZE)

  let query = revisionsTable(client)
    .select(REVISION_COLUMNS)
    .eq('domain', domain)
    .eq('parent_key', parent_key)
    .order('id', { ascending: false })
    .limit(size + 1)

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

  return {
    data: await withRevisionActors(client, rows.slice(0, size)),
    hasMore: rows.length > size,
  }
})
