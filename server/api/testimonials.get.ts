import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const requestedSize = Number(query.size || 12)
  const size = Number.isFinite(requestedSize)
    ? Math.min(Math.max(requestedSize, 1), 24)
    : 12

  const { data, error } = await client
    .from('testimonials')
    .select()
    .eq('featured', true)
    .eq('status', 'Approved')
    .order('created_at', { ascending: false })
    .limit(size)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data || []
})