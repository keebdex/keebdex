import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id, cover_image, ...body } = await readBody(event)

  const { brand: brand_slug } = event.context.params || {}

  const payload = {
    ...body,
    brand_slug,
    brand_keyboard_slug: `${brand_slug}/${body.slug}`,
    typing_angle:
      !body.typing_angle || isNaN(body.typing_angle)
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

  return omitSensitive(data)
})
