import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const page = Math.max(Number(query.page) || 1, 1)
  const size = Math.min(Math.max(Number(query.size) || 12, 1), 48)
  const term = String(query.term || '').trim()

  const from = (page - 1) * size
  const to = from + size - 1

  let request = client
    .from('testimonials')
    .select('id, name, role, content, avatar_url, created_at', {
      count: 'exact',
    })
    .eq('status', 'Approved')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (term) {
    request = request.or(
      `name.ilike.%${term}%,role.ilike.%${term}%,content.ilike.%${term}%`,
    )
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
