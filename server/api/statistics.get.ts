import { serverSupabaseClient } from '#supabase/server'
import { getLocalTimeZone, today } from '@internationalized/date'
import groupBy from 'lodash.groupby'
import sortBy from 'lodash.sortby'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const startOfDay = today(getLocalTimeZone()).toString()

  const { data } = await client
    .from('colorways')
    .select('*, maker:makers(name, invertible_logo)')
    .gte('created_at', startOfDay)

  const makers = Object.entries(groupBy(data, 'maker.name')).map(
    ([name, keycaps]) => {
      return {
        name,
        invertible_logo: keycaps[0].maker.invertible_logo,
        id: keycaps[0].maker_id,
        additions: keycaps.length,
      }
    },
  )

  const { data: keycaps } = await client
    .from('keycaps')
    .select('*, profile:keycap_profiles(name, manufacturer_id)')
    .eq('status', 'Live')
    .eq('review_status', 'Approved')
  // .lte('start_date', startOfDay)
  // .gte('end_date', startOfDay)

  return {
    makers: sortBy(makers, 'name'),
    keycaps: sortBy(keycaps, 'profile_keycap_id'),
  }
})
