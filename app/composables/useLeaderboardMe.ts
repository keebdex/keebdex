import type { LeaderboardPeriod } from '~/utils/leaderboard'

/**
 * The signed-in user's own row on the leaderboard for `query`, loaded in the
 * browser only: the board itself is the same for every visitor and renders
 * on the server, while the user is known only once the store restores the
 * session after mount. Refreshes when the query or the session changes.
 */
export const useLeaderboardMe = (
  query: MaybeRefOrGetter<{ period: LeaderboardPeriod; module?: KeebModule }>,
) => {
  const { authenticated } = storeToRefs(useUserStore())

  const { data } = useAsyncData(
    () => `leaderboard-me-${JSON.stringify(toValue(query))}`,
    () =>
      authenticated.value
        ? $fetch('/api/leaderboard/me', { query: toValue(query) })
        : Promise.resolve(null),
    { server: false, watch: [authenticated], default: () => null },
  )

  return data
}
