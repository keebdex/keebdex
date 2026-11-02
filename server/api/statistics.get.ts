import { serverSupabaseClient } from '#supabase/server'
import { getLocalTimeZone, today } from '@internationalized/date'
import { uniqBy } from 'es-toolkit'
import { sortBy } from 'es-toolkit/compat'
import { PUBLISHED_FILTER, liveGroupBuys } from '../utils'

// What the home page shows: photos for its keycap mosaic, and the busiest
// makers and the group buys closing first in Happening Now
const SHOWCASE_SIZE = 12
const MAKER_SIZE = 8
const KEYSET_SIZE = 5

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const startOfDay = today(getLocalTimeZone()).subtract({ days: 1 }).toString()

  // Only the size of each catalog is needed, not its rows
  const count = (table: 'artisan_makers' | 'keysets' | 'keyboards') =>
    client
      .from(table)
      .select('*', { count: 'exact', head: true })
      .or(PUBLISHED_FILTER)

  // Independent, so they all run at once
  const [
    colorways,
    liveKeysets,
    latest,
    colorwayCount,
    makerCount,
    keysetCount,
    keyboardCount,
  ] = await Promise.all([
    // Only the maker of each new published colorway is needed to count additions
    client
      .from('artisan_colorways')
      .select('maker_id, maker:artisan_makers(name, invertible_logo)')
      .gte('created_at', startOfDay)
      .or(PUBLISHED_FILTER),
    // The live group buys closing first, with how many are live in all
    liveGroupBuys(
      client
        .from('keysets')
        .select(
          'name, img, start_date, end_date, profile_keyset_id, profile:keyset_profiles(name)',
          { count: 'exact' },
        )
        .or(PUBLISHED_FILTER),
    )
      .order('end_date')
      .limit(KEYSET_SIZE),
    // The newest photographed colorways; a few sculpts can fill this many
    // rows, so the mosaic keeps one colorway per sculpt below
    client
      .from('artisan_colorways')
      .select('colorway_id, name, img, maker_id, sculpt_id, maker_sculpt_id')
      .not('img', 'is', null)
      .not('deleted', 'is', true)
      .or(PUBLISHED_FILTER)
      .order('created_at', { ascending: false })
      .limit(SHOWCASE_SIZE * 4),
    // The planner's estimate: an exact count scans every colorway and can
    // time out, and the hero shows it as a round figure anyway
    client
      .from('artisan_colorways')
      .select('*', { count: 'estimated', head: true })
      .not('deleted', 'is', true)
      .or(PUBLISHED_FILTER),
    count('artisan_makers').eq('deleted', false),
    count('keysets'),
    count('keyboards'),
  ])

  const { data, error } = colorways

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  // Count each maker's new colorways in a single pass
  const additions = new Map()
  for (const colorway of data) {
    const name = String(colorway.maker?.name)
    const maker = additions.get(name)

    if (maker) {
      maker.additions++
    } else {
      additions.set(name, {
        name,
        invertible_logo: colorway.maker?.invertible_logo,
        maker_id: colorway.maker_id,
        additions: 1,
      })
    }
  }
  // The busiest makers first
  const makers = sortBy(
    [...additions.values()],
    [(maker) => -maker.additions, 'name'],
  ).slice(0, MAKER_SIZE)

  const { data: keysets, count: liveCount, error: keysetsError } = liveKeysets

  if (keysetsError) {
    throw createError({
      statusCode: 500,
      statusMessage: keysetsError.message,
    })
  }

  // The showcase and the counts only decorate the page, so a failed query
  // leaves them out instead of failing the live data
  const showcase = uniqBy(latest.data || [], (c) => c.maker_sculpt_id).slice(
    0,
    SHOWCASE_SIZE,
  )

  return {
    makers,
    keysets,
    liveCount: liveCount ?? keysets.length,
    showcase,
    catalog: {
      colorways: colorwayCount.count ?? null,
      makers: makerCount.count ?? null,
      keysets: keysetCount.count ?? null,
      keyboards: keyboardCount.count ?? null,
    },
  }
})
