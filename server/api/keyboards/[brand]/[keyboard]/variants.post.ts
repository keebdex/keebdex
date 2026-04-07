import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const brandSlug = event.context.params?.brand
  const keyboardSlug = event.context.params?.keyboard
  const brandKeyboardSlug = `${brandSlug}/${keyboardSlug}`

  const { error: releaseError } = await client
    .from('keyboard_releases')
    .select('id')
    .eq('id', body.release_id)
    .eq('brand_keyboard_slug', brandKeyboardSlug)
    .single()

  if (releaseError) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Release not found for this keyboard',
    })
  }

  const payload = {
    release_id: Number(body.release_id),
    variant_name: body.variant_name,
    finish_type: body.finish_type,
    units_produced:
      body.units_produced && !isNaN(body.units_produced)
        ? Number(body.units_produced)
        : null,
    release_year:
      body.release_year && !isNaN(body.release_year)
        ? Number(body.release_year)
        : null,
    sale_type: body.sale_type || null,
    image_url: body.image_url || null,
    photo_credit: body.photo_credit || null,
    brand_slug: brandSlug,
    brand_keyboard_slug: brandKeyboardSlug,
  }

  let result

  if (body.id) {
    result = await client
      .from('keyboard_variants')
      .update(payload)
      .eq('id', body.id)
      .eq('brand_keyboard_slug', brandKeyboardSlug)
      .select()
      .single()
  } else {
    result = await client
      .from('keyboard_variants')
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

  return omitSensitive(result.data)
})
