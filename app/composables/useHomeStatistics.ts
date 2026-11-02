// The home page's live data (GET /api/statistics), fetched once and shared
// by its hero, Happening Now, and Browse the Dex sections
export async function useHomeStatistics() {
  const empty = () => ({
    makers: [],
    keysets: [],
    liveCount: 0,
    showcase: [],
    catalog: {} as Record<string, number | null>,
  })

  const { data } = await useAsyncData(
    'home-statistics',
    () => $fetch('/api/statistics').catch(empty),
    { default: empty },
  )

  // Each catalog's size as shown, '' when its count failed; colorways are
  // the database's estimate, so they read as a round figure
  const catalogCount = (key: 'makers' | 'colorways' | 'keysets' | 'keyboards') => {
    const value = data.value.catalog[key]
    if (!value) return ''

    return key === 'colorways' ? formatEstimate(value) : formatNumber(value)
  }

  return { data, catalogCount }
}

