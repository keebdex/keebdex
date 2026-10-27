import { serverSupabaseClient } from '#supabase/server'
import { PUBLISHED_FILTER, liveGroupBuys, omitSensitive } from '../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { profile_id, page, size, status }: Record<string, any> =
    getQuery(event)

  const pageSize = Math.max(Number(size) || 36, 1)
  const from = (Math.max(Number(page) || 1, 1) - 1) * pageSize
  const to = from + pageSize - 1

  // Group buy tabs: Interest Check is a status; Live goes by the group buy
  // dates of confirmed sets, so a set leaves it on its own once it ends.
  // Anything else lists a profile's keysets.
  const isGroupBuyTab = status === 'ic' || status === 'live'

  const buildQuery = (head = false) => {
    const keysets = (select = '*, profile:keyset_profiles(name)') =>
      client
        .from('keysets')
        .select(select, { count: 'exact', head })
        .or(PUBLISHED_FILTER)

    if (status === 'ic') {
      return keysets()
        .eq('status', 'Interest Check')
        .order('ic_date', { ascending: false })
    }

    if (status === 'live') {
      return liveGroupBuys(keysets()).order('start_date', { ascending: true })
    }

    return keysets('*').eq('profile_id', profile_id).order('profile_keyset_id')
  }

  const [listing, profileResult] = await Promise.all([
    buildQuery().range(from, to),
    isGroupBuyTab
      ? null
      : client
          .from('keyset_profiles')
          .select()
          .eq('profile_id', profile_id)
          .single(),
  ])

  let { data, count, error } = listing

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

  if (profileResult?.error) {
    throw createError({
      statusCode: 404,
      statusMessage: profileResult.error.message,
    })
  }

  return {
    keysets: data?.map(omitSensitive),
    profile: profileResult?.data ?? null,
    count,
  }
})
