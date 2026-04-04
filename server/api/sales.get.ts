import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { start, end } = getQuery(event)

  const { data, error } = await client
    .from('sales')
    .select('*, maker:artisan_makers(*)')
    .gte('date', start)
    .lte('date', end)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
