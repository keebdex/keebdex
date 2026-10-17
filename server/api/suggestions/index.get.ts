import { createError, defineEventHandler, getQuery } from 'h3'
import { getReviewQueueContext } from '../../utils/submission-queue'
import {
  SUGGESTION_COLUMNS,
  suggestionsTable,
  withSuggestionRecords,
} from '../../utils/edit-suggestions'

const DOMAINS = ['artisan', 'keyset', 'keyboard']

/**
 * Edits tab of `/{domain}/submissions`: suggestions of one domain and status,
 * newest first, each with its record's current values. RLS returns the
 * caller's own suggestions plus, for staff, those of their scope; regular
 * users are narrowed to their own here too.
 */
export default defineEventHandler(async (event) => {
  const { client, user, isModerator, status, page, size, from } =
    await getReviewQueueContext(event)

  const domain = String(getQuery(event).domain || '')

  if (!DOMAINS.includes(domain)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid domain' })
  }

  let request = suggestionsTable(client)
    .select(SUGGESTION_COLUMNS, { count: 'exact' })
    .eq('domain', domain)
    .eq('review_status', status)
    .order('created_at', { ascending: false })
    .range(from, from + size - 1)

  if (!isModerator) {
    request = request.eq('submitted_by', user.sub)
  }

  const { data, count, error } = await request

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    data: await withSuggestionRecords(client, data || []),
    count: count || 0,
    page,
    size,
  }
})
