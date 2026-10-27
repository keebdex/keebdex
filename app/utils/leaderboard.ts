// Points per contribution, as scored by the `leaderboard` database function
// (supabase/migrations/20261027000000_leaderboard.sql).
export const LEADERBOARD_POINTS = {
  pages: 5,
  items: 3,
  suggestions: 1,
} as const

export const LEADERBOARD_PERIODS = ['all', 'month'] as const

export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number]

export const isLeaderboardPeriod = (value: unknown): value is LeaderboardPeriod =>
  LEADERBOARD_PERIODS.includes(value as LeaderboardPeriod)

export interface LeaderboardEntry {
  rank: number
  user_id: string
  name: string
  avatar: string | null
  points: number
  pages: number
  items: number
  suggestions: number
}

/**
 * A row of the `leaderboard` / `leaderboard_me` functions as the API returns
 * it: the generated types read name and avatar as text, but either can be
 * null, so a nameless collector gets a placeholder name here once.
 */
export const toLeaderboardEntry = (row: Omit<LeaderboardEntry, 'name' | 'avatar'> & {
  name: string | null
  avatar: string | null
}): LeaderboardEntry => ({
  ...row,
  name: row.name || 'Anonymous Collector',
  avatar: row.avatar || null,
})

/** The caller's own row when they are not among `entries` already. */
export const leaderboardOwnRow = (
  entries: LeaderboardEntry[],
  me: LeaderboardEntry | null | undefined,
) =>
  me && !entries.some((entry) => entry.user_id === me.user_id) ? me : null

// Gold, silver, and bronze by rank, so tied collectors share a medal
export const leaderboardMedal = (rank: number) =>
  (
    ({
      1: {
        text: 'text-amber-500',
        ring: 'ring-amber-400',
        step: 'from-amber-400/30 to-amber-400/5 border-amber-400',
      },
      2: {
        text: 'text-slate-400',
        ring: 'ring-slate-300 dark:ring-slate-400',
        step: 'from-slate-400/25 to-slate-400/5 border-slate-300 dark:border-slate-400',
      },
      3: {
        text: 'text-orange-700 dark:text-orange-400',
        ring: 'ring-orange-600 dark:ring-orange-400',
        step: 'from-orange-600/25 to-orange-600/5 border-orange-600 dark:border-orange-400',
      },
    }) as Record<number, { text: string; ring: string; step: string }>
  )[rank]

// Count columns of the board on wide screens
export const LEADERBOARD_COLUMNS = [
  { key: 'pages', label: 'Pages', noun: 'page', icon: 'hugeicons:file-02' },
  { key: 'items', label: 'Items', noun: 'item', icon: 'hugeicons:layers-01' },
  {
    key: 'suggestions',
    label: 'Edits',
    noun: 'edit',
    icon: 'hugeicons:edit-02',
  },
] as const
