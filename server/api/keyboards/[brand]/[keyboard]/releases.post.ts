import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { variants, ...body } = await readBody(event)

  const brandSlug = event.context.params?.brand
  const keyboardSlug = event.context.params?.keyboard
  const brandKeyboardSlug = `${brandSlug}/${keyboardSlug}`

  const payload = {
    ...body,
    brand_keyboard_slug: brandKeyboardSlug,
    release_year:
      body.release_year === '' || body.release_year === null
        ? null
        : Number(body.release_year),
    typing_angle:
      body.typing_angle === '' || body.typing_angle === null
        ? null
        : Number(body.typing_angle),
  }

  let result

  if (body.id) {
    result = await client
      .from('keyboard_releases')
      .update(payload)
      .eq('id', body.id)
      .eq('brand_keyboard_slug', brandKeyboardSlug)
      .select()
      .single()
  } else {
    result = await client
      .from('keyboard_releases')
      .insert(payload)
      .select()
      .single()
  }

  if (result.error) {
    throw createError({
      statusCode: 500,
      statusMessage: result.error.message,
    })
  }

  return result.data
})
