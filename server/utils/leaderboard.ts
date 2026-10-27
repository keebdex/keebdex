import type { H3Event } from 'h3'
import { isKeebModule } from '~/utils/keeb-modules'
import { isLeaderboardPeriod } from '~/utils/leaderboard'

/** `?period=all|month&module=` of the leaderboard endpoints, validated. */
export const getLeaderboardQuery = (event: H3Event) => {
  const { period = 'all', module } = getQuery(event)

  if (!isLeaderboardPeriod(period)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid period' })
  }
  if (module && !isKeebModule(module)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid module' })
  }

  return { period, module: module || undefined }
}
