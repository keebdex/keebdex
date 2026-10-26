import { serverSupabaseClient } from '#supabase/server'
import { sortBy } from 'es-toolkit/compat'
import { omitSensitive, publishedOrOwnFilter } from '../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  // Makers under review stay out of the list (`?own=1` adds the caller's).
  const { data, error } = await client
    .from('artisan_makers')
    .select()
    .or(await publishedOrOwnFilter(event, getQuery(event).own))

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return sortBy(data?.map(omitSensitive), 'maker_id')
})
