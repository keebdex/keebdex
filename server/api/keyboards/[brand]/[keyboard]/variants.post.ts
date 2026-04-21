import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive, toNullableNumber } from '../../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('keyboard_variants', await readBody(event))

  const { error: releaseError } = await client
    .from('keyboard_releases')
    .select('id')
    .eq('id', body.release_id)
    .eq('brand_keyboard_slug', body.brand_keyboard_slug)
    .single()

  if (releaseError) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Release not found for this keyboard',
    })
  }

  const payload = {
    release_id: body.release_id,
    variant_name: body.variant_name,
    finish_type: body.finish_type,
    units_produced: toNullableNumber(body.units_produced),
    release_year: toNullableNumber(body.release_year),
    sale_type: body.sale_type || null,
    img_front: body.img_front || null,
    img_back: body.img_back || null,
    photo_credit: body.photo_credit || null,
    currency: body.currency || null,
    msrp_price: toNullableNumber(body.msrp_price),
    case_materials: Array.isArray(body.case_materials)
      ? body.case_materials
      : null,
    pcb_types: Array.isArray(body.pcb_types) ? body.pcb_types : null,
    plate_materials: Array.isArray(body.plate_materials)
      ? body.plate_materials
      : null,
    weight_materials: Array.isArray(body.weight_materials)
      ? body.weight_materials
      : null,
    brand_slug: body.brand_slug,
    brand_keyboard_slug: body.brand_keyboard_slug,
  }

  let result

  if (body.id) {
    result = await client
      .from('keyboard_variants')
      .update(payload)
      .eq('id', body.id)
      .eq('brand_keyboard_slug', body.brand_keyboard_slug)
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
