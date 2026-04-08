import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('user_collections')
    .select(
      '*, items:user_collection_items(*, artisan:artisan_colorways(*, sculpt:artisan_sculpts(name)), keycap:keysets(*, profile:keyset_profiles(name)), keyboard:keyboard_variants(*, release:keyboard_releases(id, name, brand_keyboard_slug, keyboard:keyboards(name, slug)), brand:keyboard_brands(name, slug)))',
    )
    .eq('id', event.context.params?.collection)
    .single()

  if (error) {
    throw createError({
      statusCode: 404,
      statusMessage: error.message,
    })
  }

  return data
})
