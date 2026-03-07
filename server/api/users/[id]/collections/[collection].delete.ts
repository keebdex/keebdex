import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { params } = event.context

  const { error: itemsError } = await client
    .from('user_collection_items')
    .delete()
    .eq('uid', params?.id)
    .eq('collection_id', params?.collection)

  if (itemsError) {
    throw createError({
      statusCode: 500,
      statusMessage: itemsError.message,
    })
  }

  const { data, error } = await client
    .from('user_collections')
    .delete()
    .eq('id', params?.collection)
    .eq('uid', params?.id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
