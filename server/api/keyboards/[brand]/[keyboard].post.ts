import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const brandSlug = event.context.params?.brand
  const keyboardSlug = event.context.params?.keyboard
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)

  if (!body?.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Keyboard name is required',
    })
  }

  if (!body?.layout) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Keyboard layout is required',
    })
  }

  const finalKeyboardSlug = body.slug || keyboardSlug
  const brandKeyboardSlug = `${brandSlug}/${finalKeyboardSlug}`

  const payload = {
    ...body,
    slug: finalKeyboardSlug,
    brand_slug: brandSlug,
    brand_keyboard_slug: brandKeyboardSlug,
    typing_angle:
      body.typing_angle === '' || body.typing_angle === null
        ? null
        : Number(body.typing_angle),
  }

  const { data, error } = await client
    .from('keyboards')
    .upsert(payload, { onConflict: 'brand_keyboard_slug' })
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
