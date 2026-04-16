import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('user_collection_items', await readBody(event))

  const { data, error } = await client
    .from('user_collection_items')
    .update(body)
    .eq('id', event.context.params?.item)
    .eq('uid', event.context.params?.id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
