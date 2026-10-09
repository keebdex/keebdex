import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../utils'

const statusMap: Record<string, string[]> = {
  ic: ['Interest Check'],
  live: ['Live', 'Scheduled'],
  ended: ['In Production', 'Shipping'],
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { profile_id, page, size, status }: Record<string, any> =
    getQuery(event)

  const pageSize = Math.max(Number(size) || 36, 1)
  const from = (Math.max(Number(page) || 1, 1) - 1) * pageSize
  const to = from + pageSize - 1

  const buildQuery = (head = false) => {
    switch (status) {
      case 'ic':
        return client
          .from('keysets')
          .select('*, profile:keyset_profiles(name)', { count: 'exact', head })
          .in('status', statusMap[status] || [])
          .neq('review_status', 'Pending')
          .neq('review_status', 'Rejected')
          .order('ic_date', { ascending: false })
      case 'live':
      case 'ended':
        return client
          .from('keysets')
          .select('*, profile:keyset_profiles(name)', { count: 'exact', head })
          .in('status', statusMap[status] || [])
          .neq('review_status', 'Pending')
          .neq('review_status', 'Rejected')
          .order('start_date', { ascending: status === 'live' })
      default:
        return client
          .from('keysets')
          .select('*', { count: 'exact', head })
          .eq('profile_id', profile_id)
          .neq('status', '')
          .neq('review_status', 'Pending')
          .neq('review_status', 'Rejected')
          .order('profile_keyset_id')
    }
  }

  let { data, count, error } = await buildQuery().range(from, to)

  // PostgREST rejects a range past the last row (e.g. a stale page in the
  // URL), so report the real count with an empty page instead
  if (error?.code === 'PGRST103') {
    ;({ count, error } = await buildQuery(true))
    data = []
  }

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
