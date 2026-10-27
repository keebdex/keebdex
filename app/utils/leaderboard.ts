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
  name: string | null
  avatar: string | null
  points: number
  pages: number
  items: number
  suggestions: number
}

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
  { key: 'pages', label: 'Pages', icon: 'hugeicons:file-02' },
  { key: 'items', label: 'Items', icon: 'hugeicons:layers-01' },
  { key: 'suggestions', label: 'Edits', icon: 'hugeicons:edit-02' },
] as const
