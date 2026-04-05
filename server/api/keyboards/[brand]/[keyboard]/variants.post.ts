import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const brandSlug = event.context.params?.brand
  const keyboardSlug = event.context.params?.keyboard
  const brandKeyboardSlug = `${brandSlug}/${keyboardSlug}`

  if (!body?.release_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Release is required',
    })
  }

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
    currency: body.currency || null,
    msrp_price:
      body.msrp_price === '' || body.msrp_price === null
        ? null
        : Number(body.msrp_price),
    default_weight_material: body.default_weight_material || null,
    units_produced:
      body.units_produced === '' || body.units_produced === null
        ? null
        : Number(body.units_produced),
    image_url: body.image_url || null,
    weight_finish: body.weight_finish || null,
    brand_slug: brandSlug,
  }

  let result

  if (body.id) {
    result = await client
      .from('keyboard_variants')
      .update(payload)
      .eq('id', body.id)
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

  return result.data
})
