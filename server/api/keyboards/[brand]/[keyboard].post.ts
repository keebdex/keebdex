import { serverSupabaseClient } from '#supabase/server'
import {
  omitSensitive,
  pickTableFields,
  toNullableNumber,
} from '../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('keyboards', await readBody(event))
  const { brand, keyboard } = event.context.params || {}

  const payload = {
    ...body,
    brand_slug: brand,
    brand_keyboard_slug: `${brand}/${keyboard}`,
    typing_angle: toNullableNumber(body.typing_angle),
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

  return omitSensitive(data)
})
