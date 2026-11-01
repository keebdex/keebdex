// The home page's live data (GET /api/statistics), fetched once and shared
// by its hero, Happening Now, and Browse the Dex sections
export function useHomeStatistics() {
  const empty = () => ({
    makers: [],
    keysets: [],
    showcase: [],
    catalog: {} as Record<string, number | null>,
  })

  return useAsyncData(
    'home-statistics',
    () => $fetch('/api/statistics').catch(empty),
    { default: empty },
  )
}

// The colorway count is the database's estimate, so it reads as a round
// figure: "68,000+"
export const formatEstimate = (value: number) =>
  `${formatNumber(Math.floor(value / 1000) * 1000)}+`
