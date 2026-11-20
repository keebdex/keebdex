import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

// How many item photos a collection card shows on /collection
const PREVIEW_SIZE = 4

/**
 * The session user's own collections with a few item photos each, `uid` and
 * `contact` included. Session-owner-only like the write endpoints: the app
 * loads only the signed-in user's own list (`fetchUserCollections`), and other
 * people's published collections are read through `GET /api/collections/:id`.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (user.sub !== event.context.params?.id)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('user_collections')
    .select(
      `${COLLECTION_COLUMNS}, uid, contact, preview:user_collection_items(artisan:artisan_colorways(img), keyset:keysets(img), keyboard:keyboard_variants(img_front))`,
    )
    .eq('uid', user.sub)
    .limit(PREVIEW_SIZE, { referencedTable: 'preview' })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  // Send the photos only, not the embedded rows
  return (data as any[]).map(({ preview, ...collection }) => ({
    ...collection,
    images: preview
      .map(
        (item: any) =>
          item.artisan?.img || item.keyset?.img || item.keyboard?.img_front,
      )
      .filter(Boolean),
  }))
})
