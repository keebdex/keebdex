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
        .from('keysets')
        .select('*, profile:keyset_profiles(name)', { count: 'exact' })
        .in('review_status', ['Pending'])
        .range(from, to)
      break
    case 'ic':
      query = client
        .from('keysets')
        .select('*, profile:keyset_profiles(name)', { count: 'exact' })
        .in('status', statusMap[status] || [])
        .neq('review_status', 'Pending')
        .neq('review_status', 'Rejected')
        .order('ic_date', { ascending: false })
        .range(from, to)
      break
    case 'live':
    case 'ended':
      query = client
        .from('keysets')
        .select('*, profile:keyset_profiles(name)', { count: 'exact' })
        .in('status', statusMap[status] || [])
        .neq('review_status', 'Pending')
        .neq('review_status', 'Rejected')
        .order('start_date', { ascending: status === 'live' })
        .range(from, to)
      break
    default:
      query = client
        .from('keysets')
        .select('*', { count: 'exact' })
        .eq('profile_id', profile_id)
        .neq('status', '')
        .neq('review_status', 'Pending')
        .neq('review_status', 'Rejected')
        .order('profile_keyset_id')
        .range(from, to)
      break
  }

  const { data, count, error } = await query

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const { data: profile, error: profileError } = await client
    .from('keyset_profiles')
    .select()
    .eq('id', profile_id)
    .single()

  if (
    profileError &&
    status !== 'pending' &&
    status !== 'ic' &&
    status !== 'live' &&
    status !== 'ended'
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: profileError.message,
    })
  }

  return {
    keysets: data?.map(omitSensitive),
    profile,
    count,
  }
})
