import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const body = await readBody(event)

  const { data: exist, error: checkError } = await client
    .from('user_collection_items')
    .select('*')
    .eq('uid', body.uid)
    .eq('collection_id', body.collection_id)
    .eq('artisan_item_id', body.artisan_item_id)

  if (checkError) {
    throw createError({
      statusCode: 500,
      statusMessage: checkError.message,
    })
  }

  if (exist?.length) {
    return {
      message: 'This item is already in your collection. You have great taste!',
    }
  }

  const { data, error } = await client
    .from('user_collection_items')
    .insert(body)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
