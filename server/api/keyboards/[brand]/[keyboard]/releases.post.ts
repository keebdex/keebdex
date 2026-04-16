import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive, toNullableNumber } from '../../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('keyboard_releases', await readBody(event))

  const payload = {
    ...body,
    release_year: toNullableNumber(body.release_year),
    typing_angle: toNullableNumber(body.typing_angle),
    msrp_price: toNullableNumber(body.msrp_price),
    currency: body.currency || null,
    case_materials:
      Array.isArray(body.case_materials) && body.case_materials.length
        ? body.case_materials
        : null,
    plate_materials:
      Array.isArray(body.plate_materials) && body.plate_materials.length
        ? body.plate_materials
        : null,
    weight_materials:
      Array.isArray(body.weight_materials) && body.weight_materials.length
        ? body.weight_materials
        : null,
  }

  let result

  if (body.id) {
    result = await client
      .from('keyboard_releases')
      .update(payload)
      .eq('id', body.id)
      .eq('brand_keyboard_slug', body.brand_keyboard_slug)
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

  return omitSensitive(result.data)
})
