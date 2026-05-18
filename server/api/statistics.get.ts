import { serverSupabaseClient } from '#supabase/server'
import { getLocalTimeZone, today } from '@internationalized/date'
import groupBy from 'lodash.groupby'
import sortBy from 'lodash.sortby'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const startOfDay = today(getLocalTimeZone()).subtract({ days: 1 }).toString()

  const { data, error } = await client
    .from('artisan_colorways')
    .select('*, maker:artisan_makers(name, invertible_logo)')
    .gte('created_at', startOfDay)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const makers = Object.entries(groupBy(data, 'maker.name')).map(
    ([name, keysets]) => {
      return {
        name,
        invertible_logo: keysets[0].maker.invertible_logo,
        id: keysets[0].maker_id,
        additions: keysets.length,
      }
    },
  )

  const { data: keysets, error: keysetsError } = await client
    .from('keysets')
    .select('*, profile:keyset_profiles(name, manufacturer_id)')
    .eq('status', 'Live')
    .eq('review_status', 'Approved')
  // .lte('start_date', startOfDay)
  // .gte('end_date', startOfDay)

  if (keysetsError) {
    throw createError({
      statusCode: 500,
      statusMessage: keysetsError.message,
    })
  }

  return {
    makers: sortBy(makers, 'name'),
    keysets: sortBy(keysets, 'profile_keyset_id'),
  }
})
