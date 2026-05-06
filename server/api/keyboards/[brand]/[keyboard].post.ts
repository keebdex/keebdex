import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive, toNullableNumber } from '../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('keyboards', await readBody(event))
  const { brand } = event.context.params || {}

  const payload = {
    ...body,
    brand_keyboard_slug: `${brand}/${body.slug}`,
    typing_angle: toNullableNumber(body.typing_angle),
  }

  const { data, error } = payload.id
    ? await client
        .from('keyboards')
        .update(payload)
        .eq('id', payload.id)
        .select()
        .single()
    : await client.from('keyboards').insert(payload).select().single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return omitSensitive(data)
})
