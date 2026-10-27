import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { isKeebModule } from '~/utils/keeb-modules'
import {
  isLeaderboardPeriod,
  type LeaderboardEntry,
} from '~/utils/leaderboard'

export default defineEventHandler(async (event) => {
  const { period = 'all', module } = getQuery(event)

  if (!isLeaderboardPeriod(period)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid period' })
  }
  if (module && !isKeebModule(module)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid module' })
  }

  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const args = { p_period: period, p_domain: module || null }

  // The functions are not in the generated types until the migration runs.
  const [board, me] = await Promise.all([
    (client as any).rpc('leaderboard', { ...args, p_limit: 50 }),
    user
      ? (client as any).rpc('leaderboard_me', args).maybeSingle()
      : { data: null, error: null },
  ])

  const error = board.error || me.error
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    data: (board.data || []) as LeaderboardEntry[],
    me: (me.data || null) as LeaderboardEntry | null,
  }
})
