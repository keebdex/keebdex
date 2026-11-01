import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('user_collection_items')
    // The Wishlist Image captions each cap with its sculpt and maker
    .select(
      '*, artisan:artisan_colorways(*, sculpt:artisan_sculpts(name), maker:artisan_makers(name))',
    )
    .eq('uid', event.context.params?.id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
