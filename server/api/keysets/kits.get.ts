import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('kit_categories')
    .select('slug, name, sort_order')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name')

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
