import { createError, defineEventHandler } from 'h3'
import { omitSensitive } from '../../utils'
import { getReviewQueueContext } from '../../utils/submission-queue'

export default defineEventHandler(async (event) => {
  const { client, user, isModerator, scope, status, page, size, from } =
    await getReviewQueueContext(event)

  // Colorways added directly by staff have a null review_status (implicitly
  // approved) and never enter the moderation queue.
  let request = client
    .from('artisan_colorways')
    .select(
      '*, maker:artisan_makers(id, name), sculpt:artisan_sculpts(name, review_status)',
      { count: 'exact' },
    )
    .eq('review_status', status)
    .order('created_at', { ascending: false })
    .range(from, from + size - 1)

  if (!isModerator) {
    // Regular users only see the submissions they've personally sent in.
    request = request.eq('submitted_by', user.sub)
  } else if (scope) {
    // Editors and Makers with specific assignments only moderate their own makers.
    request = request.in('maker_id', scope)
  }

  const { data, count, error } = await request

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    data: (data || []).map(omitSensitive),
    count: count || 0,
    page,
    size,
  }
})
