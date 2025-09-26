import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../utils'

const statusMap: Record<string, string[]> = {
  ic: ['Interest Check'],
  live: ['Live', 'Scheduled'],
  ended: ['In Production', 'Shipping'],
  pending: ['Pending Review'],
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { profile_id, page, size, status }: Record<string, any> =
    getQuery(event)

  const from = (page - 1) * size
  const to = page * size - 1

  let query

  switch (status) {
    case 'pending':
      query = client
        .from('keycaps')
        .select('*, profile:keycap_profiles(name)', { count: 'exact' })
        .in('review_status', ['Pending'])
        .range(from, to)
      break
    case 'ic':
      query = client
        .from('keycaps')
        .select('*, profile:keycap_profiles(name)', { count: 'exact' })
        .in('status', statusMap[status] || [])
        .neq('review_status', 'Pending')
        .neq('review_status', 'Rejected')
        .order('ic_date', { ascending: false })
        .range(from, to)
      break
    case 'live':
    case 'ended':
      query = client
        .from('keycaps')
        .select('*, profile:keycap_profiles(name)', { count: 'exact' })
        .in('status', statusMap[status] || [])
        .neq('review_status', 'Pending')
        .neq('review_status', 'Rejected')
        .order('start_date', { ascending: status === 'live' })
        .range(from, to)
      break
    default:
      query = client
        .from('keycaps')
        .select('*', { count: 'exact' })
        .eq('profile_id', profile_id)
        .neq('status', '')
        .neq('review_status', 'Pending')
        .neq('review_status', 'Rejected')
        .order('profile_keycap_id')
        .range(from, to)
      break
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
