import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../../utils'

const MAX_PAGE_SIZE = 72
// matches SEARCH_TERM_MIN_LENGTH in app/utils
const MIN_TERM_LENGTH = 3

/**
 * Every artisan colorway whose name matches the term, ordered by maker then
 * sculpt, one page at a time. `exact=1` keeps only names containing the whole
 * term as separate words. Backs the colorway search results page.
 */
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { q, page, size, exact } = getQuery(event)

  const term = String(q || '').trim()

  if (term.length < MIN_TERM_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Search term must be at least ${MIN_TERM_LENGTH} characters.`,
    })
  }

  const pageSize = Math.min(Math.max(Number(size) || 24, 1), MAX_PAGE_SIZE)
  const from = (Math.max(Number(page) || 1, 1) - 1) * pageSize
  const to = from + pageSize - 1
  const exactMatch = exact === '1' || exact === 'true'

  const { data, count, error } = await matchColorwaysByName(client, term, {
    count: 'exact',
    exact: exactMatch,
  })
    .order('maker_id')
    .order('sculpt_id')
    .order('name')
    .range(from, to)

  // PostgREST rejects a range past the last row (e.g. a stale page in the
  // URL), so report the real total with an empty page instead
  if (error?.code === 'PGRST103') {
    const { count: total } = await matchColorwaysByName(client, term, {
      count: 'exact',
      head: true,
      exact: exactMatch,
    })

    return { data: [], total: total ?? 0 }
  }

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return {
    data: (data || []).map(omitSensitive),
    total: count ?? 0,
  }
})
