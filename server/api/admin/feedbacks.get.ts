import { createError, defineEventHandler, getQuery } from 'h3'
import { requireAdminClient } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)
  const query = getQuery(event)

  const page = Math.max(Number(query.page) || 1, 1)
  const size = Math.min(Math.max(Number(query.size) || 20, 1), 100)
  const resolved = String(query.resolved ?? 'false').trim() === 'true'

  const from = (page - 1) * size
  const to = from + size - 1

  let request = client
    .from('feedbacks')
    .select('*', {
      count: 'exact',
    })
    .order('id', { ascending: false })
    .range(from, to)

  if (resolved) {
    request = request.eq('resolved', true)
  } else {
    request = request.eq('resolved', false)
  }

  const { data, count, error } = await request

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    size,
  }
})
