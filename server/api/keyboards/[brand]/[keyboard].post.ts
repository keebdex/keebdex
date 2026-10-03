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
        .maybeSingle()
    : await client.from('keyboards').insert(payload).select().single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  // RLS filters rows silently, so no row back means the edit was refused.
  if (payload.id && !data) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can't edit this keyboard in its current state",
    })
  }

  return omitSensitive(data)
})
