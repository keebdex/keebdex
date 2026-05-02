import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const page = Math.max(Number(query.page) || 1, 1)
  const size = Math.min(Math.max(Number(query.size) || 12, 1), 48)

  const from = (page - 1) * size
  const to = from + size - 1

  const { data, count, error } = await client
    .from('testimonials')
    .select('id, name, role, content, avatar_url', {
      count: 'exact',
    })
    .eq('status', 'Approved')
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
