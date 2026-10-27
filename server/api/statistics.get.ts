import { serverSupabaseClient } from '#supabase/server'
import { getLocalTimeZone, today } from '@internationalized/date'
import { sortBy } from 'es-toolkit/compat'
import { PUBLISHED_FILTER, liveGroupBuys } from '../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const startOfDay = today(getLocalTimeZone()).subtract({ days: 1 }).toString()

  // Independent, so both run at once
  const [colorways, liveKeysets] = await Promise.all([
    // Only the maker of each new published colorway is needed to count additions
    client
      .from('artisan_colorways')
      .select('maker_id, maker:artisan_makers(name, invertible_logo)')
      .gte('created_at', startOfDay)
      .or(PUBLISHED_FILTER),
    // Only the fields the home page's fresh releases marquee shows
    liveGroupBuys(
      client
        .from('keysets')
        .select(
          'name, img, start_date, end_date, profile_id, profile_keyset_id, profile:keyset_profiles(name, manufacturer_id)',
        )
        .or(PUBLISHED_FILTER),
    ),
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
  const makers = [...additions.values()]

  const { data: keysets, error: keysetsError } = liveKeysets

  if (keysetsError) {
    throw createError({
      statusCode: 500,
      statusMessage: keysetsError.message,
    })
  }

  return {
    makers: sortBy(makers, 'name'),
    keysets: sortBy(keysets, 'profile_keyset_id'),
  }
})
