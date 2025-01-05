import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data } = await client
    .from('user_collections')
    .select(
      '*, items:user_collection_items(*, artisan:colorways(*, sculpt:sculpts(name)), keycap:keycaps(*))',
    )
    .eq('id', event.context.params?.collection)
    .single()

  return data
})
