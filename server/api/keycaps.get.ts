import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { profile_id, page, size, status }: Record<string, any> =
    getQuery(event)

  const from = (page - 1) * size
  const to = page * size - 1

  let query

  if (status === 'Review') {
    query = client
      .from('keycaps')
      .select('*, profile:keycap_profiles(name)', { count: 'exact' })
      .in('review_status', ['Pending'])
      .range(from, to)
  } else {
    query = status
      ? client
          .from('keycaps')
          .select('*, profile:keycap_profiles(name)', { count: 'exact' })
          .eq('status', status)
          .neq('review_status', 'Pending')
          .neq('review_status', 'Rejected')
          .order('ic_date', { ascending: false })
          .range(from, to)
      : client
          .from('keycaps')
          .select('*', { count: 'exact' })
          .eq('profile_id', profile_id)
          .neq('status', status)
          .neq('review_status', 'Pending')
          .neq('review_status', 'Rejected')
          .order('profile_keycap_id')
          .range(from, to)
  }

  const { data, count } = await query

  const { data: profile } = await client
    .from('keycap_profiles')
    .select()
    .eq('id', profile_id)
    .single()

  return {
    keycaps: data?.map(omitSensitive),
    profile,
    count,
  }
})
