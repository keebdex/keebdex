import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('user_collections')
    .select('*, total_items:user_collection_items(count)')
    .eq('uid', event.context.params?.id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  data?.forEach((collection) => {
    collection.total_items = collection.total_items[0]?.count
  })

  return data
})
