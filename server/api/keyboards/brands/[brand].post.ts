import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../../../utils'

export default defineEventHandler(async (event) => {
  const { keyboards, ...body } = await readBody(event)
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('keyboard_brands')
    .upsert(body, { onConflict: 'slug' })
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
