import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('keyboard_brands')
    .select('*, keyboards(id, keyboard_releases(id))')
    .order('slug', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data.map(omitSensitive)
})
