import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const brandSlug = event.context.params?.brand
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)

  if (!body?.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Brand name is required',
    })
  }

  const payload = {
    ...body,
    slug: brandSlug,
  }

  const { data, error } = await client
    .from('keyboard_brands')
    .upsert(payload, { onConflict: 'slug' })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
