import { serverSupabaseClient } from '#supabase/server'

// How many item photos a collection card shows on /collection
const PREVIEW_SIZE = 4

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('user_collections')
    .select(
      '*, preview:user_collection_items(artisan:artisan_colorways(img), keyset:keysets(img), keyboard:keyboard_variants(img_front))',
    )
    .eq('uid', event.context.params?.id)
    .limit(PREVIEW_SIZE, { referencedTable: 'preview' })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  // Send the photos only, not the embedded rows
  return data.map(({ preview, ...collection }) => ({
    ...collection,
    images: preview
      .map(
        (item) =>
          item.artisan?.img || item.keyset?.img || item.keyboard?.img_front,
      )
      .filter(Boolean),
  }))
})
