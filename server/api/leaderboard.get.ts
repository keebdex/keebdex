import { serverSupabaseClient } from '#supabase/server'
import { toLeaderboardEntry } from '~/utils/leaderboard'

// The public board, the same for every visitor; the caller's own rank is
// /api/leaderboard/me
export default defineEventHandler(async (event) => {
  const { period, module } = getLeaderboardQuery(event)
  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('leaderboard', {
    p_period: period,
    p_domain: module,
    // The podium and seven more; everyone else sees only their own rank
    p_limit: 10,
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (data || []).map(toLeaderboardEntry)
})
