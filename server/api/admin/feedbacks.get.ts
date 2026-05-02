import { createError, defineEventHandler, getQuery } from 'h3'
import { requireAdminClient } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)
  const query = getQuery(event)

  const page = Math.max(Number(query.page) || 1, 1)
  const size = Math.min(Math.max(Number(query.size) || 20, 1), 100)

  const from = (page - 1) * size
  const to = from + size - 1

  const { data, count, error } = await client
    .from('feedbacks')
    .select('*', {
      count: 'exact',
    })
    .order('id', { ascending: false })
    .range(from, to)

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
