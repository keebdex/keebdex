import { serverSupabaseClient } from '#supabase/server'
import { crc32 } from 'crc'
import slugify from 'slugify'

const selfMakers = ['alpha-keycaps', 'gooey-keys']

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { keycap, sculpt, ...rest } = await readBody(event)

  if (!rest.colorway_id || selfMakers.includes(rest.maker_id)) {
    const slug = slugify(rest.name, { lower: true })
    rest.colorway_id = crc32(
      `${rest.maker_id}-${rest.sculpt_id}-${slug}-${rest.order}`,
    ).toString(16)
  }

  const sqlQuery = rest.id
    ? client.from('artisan_colorways').update(rest).eq('id', rest.id)
    : client
        .from('artisan_colorways')
        .upsert(rest)
        .eq('colorway_id', rest.colorway_id)
        .eq('maker_id', rest.maker_id)
        .eq('sculpt_id', rest.sculpt_id)

  const { data, error } = await sqlQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
