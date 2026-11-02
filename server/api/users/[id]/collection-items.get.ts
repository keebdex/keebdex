import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('user_collection_items')
    // Only what the Wishlist Image shows, captions (sculpt and maker) and
    // text export included; full colorway rows made the response far larger
    .select(
      'id, collection_id, order, exchange, priority, asking_price, artisan:artisan_colorways(id, colorway_id, name, img, maker_id, sculpt_id, sculpt:artisan_sculpts(name), maker:artisan_makers(name))',
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
