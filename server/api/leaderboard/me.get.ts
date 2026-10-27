import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { toLeaderboardEntry } from '~/utils/leaderboard'

// The caller's own row on the board, ranked even when they hid themselves;
// null when signed out or without contributions in the period
export default defineEventHandler(async (event) => {
  const { period, module } = getLeaderboardQuery(event)
  const user = await serverSupabaseUser(event)

  if (!user) return null

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .rpc('leaderboard_me', { p_period: period, p_domain: module })
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data ? toLeaderboardEntry(data) : null
})
