import { serverSupabaseClient } from '#supabase/server'

/**
 * A collection with its items. `uid`, `contact`, and each item's `uid` belong
 * to the owner only: everyone else gets the public fields, and every caller
 * gets `is_owner` so the page knows whether to offer Edit and Delete.
 */
export default defineEventHandler(async (event) => {
  const user = await optionalUser(event)
  const client = await serverSupabaseClient(event)

  // Guests never ask for the owner-only columns; a signed-in caller might be
  // the owner, so it asks for them and they are dropped below if not. If the
  // database ever hides these columns from `authenticated` too, look the owner
  // up first (a query on `id` and `uid` of the caller's own rows) instead.
  const collectionColumns = user
    ? `${COLLECTION_COLUMNS}, uid, contact`
    : COLLECTION_COLUMNS
  const itemColumns = user
    ? `${COLLECTION_ITEM_COLUMNS}, uid`
    : COLLECTION_ITEM_COLUMNS

  const { data, error } = await client
    .from('user_collections')
    .select(
      `${collectionColumns}, items:user_collection_items(${itemColumns}, artisan:artisan_colorways(*, sculpt:artisan_sculpts(name)), keyset:keysets(*, profile:keyset_profiles(name)), keyboard:keyboard_variants(*, release:keyboard_releases(id, name, brand_keyboard_slug, keyboard:keyboards(name, slug)), brand:keyboard_brands(name, slug)))`,
    )
    .eq('id', event.context.params?.collection)
    .single()

  if (error) {
    // No such row (or RLS hides it), or an id that is not a uuid
    if (error.code === 'PGRST116' || error.code === '22P02') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Collection not found',
      })
    }

    console.error('collection read error', error.code, error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not load the collection',
    })
  }

  const row = data as any

  if (user && row.uid === user.sub) {
    return { ...row, is_owner: true }
  }

  const { uid: _uid, contact: _contact, items, ...collection } = row

  return {
    ...collection,
    items: (items || []).map(({ uid: _itemUid, ...item }: any) => item),
    is_owner: false,
  }
})
