import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive, publishedOrOwnFilter } from '../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('keyboard_brands')
    .select()
    // Brands under review stay out of the list (`?own=1` adds the caller's).
    .or(await publishedOrOwnFilter(event, getQuery(event).own))
    .order('slug', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data.map(omitSensitive)
})
