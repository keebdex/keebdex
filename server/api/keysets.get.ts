import { serverSupabaseClient } from '#supabase/server'
import { PUBLISHED_FILTER, omitSensitive } from '../utils'
import { isoToday } from '~/utils/keyset-status'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { profile_id, page, size, status }: Record<string, any> =
    getQuery(event)

  const pageSize = Math.max(Number(size) || 36, 1)
  const from = (Math.max(Number(page) || 1, 1) - 1) * pageSize
  const to = from + pageSize - 1

  const buildQuery = (head = false) => {
    const today = isoToday()
    const keysets = () =>
      client
        .from('keysets')
        .select('*, profile:keyset_profiles(name)', { count: 'exact', head })
        .or(PUBLISHED_FILTER)

    // Group buy tabs: Interest Check is a status; Live goes by the group buy
    // dates of confirmed sets, so a set leaves it on its own once it ends.
    switch (status) {
      case 'ic':
        return keysets()
          .eq('status', 'Interest Check')
          .order('ic_date', { ascending: false })
      // Today falls within the group buy of a confirmed set
      case 'live':
        return keysets()
          .lte('start_date', today)
          .gte('end_date', today)
          .eq('status', 'Confirmed')
          .order('start_date', { ascending: true })
      default:
        return client
          .from('keysets')
          .select('*', { count: 'exact', head })
          .eq('profile_id', profile_id)
          .or(PUBLISHED_FILTER)
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
    .eq('profile_id', profile_id)
    .single()

  if (
    profileError &&
    status !== 'pending' &&
    status !== 'ic' &&
    status !== 'live'
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
