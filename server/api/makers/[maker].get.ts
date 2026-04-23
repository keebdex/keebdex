import { serverSupabaseClient } from '#supabase/server'
import groupBy from 'lodash.groupby'
import keyBy from 'lodash.keyby'
import sortBy from 'lodash.sortby'
import { omitSensitive } from '../../utils'

function sortSculpts(sculpts: any) {
  const revisionMap: Record<string, any> = {}
  let originals = []

  for (const sculpt of sculpts) {
    if (!sculpt.is_revision_of) {
      originals.push(sculpt)
    } else {
      if (!revisionMap[sculpt.is_revision_of]) {
        revisionMap[sculpt.is_revision_of] = []
      }
      revisionMap[sculpt.is_revision_of].push(sculpt)
    }
  }

  // Sort originals by name, then collection + name
  originals = sortBy(originals, (s) =>
    s.collection ? s.collection + s.name : s.name,
  )

  const sortedSculpts = []
  for (const original of originals) {
    sortedSculpts.push(original)
    if (revisionMap[original.maker_sculpt_id]) {
      let revisions = revisionMap[original.maker_sculpt_id]
      // Sort revisions by name, then collection + name
      revisions = sortBy(revisions, (s) =>
        s.collection ? s.collection + s.name : s.name,
      )

      sortedSculpts.push(...revisions)
    }
  }

  return sortedSculpts
}

export default defineEventHandler(async (event) => {
  const makerId = event.context.params?.maker
  const query: Record<string, any> = getQuery(event)
  const ascending = query.sort === 'asc'

  const client = await serverSupabaseClient(event)
  const { data: profile, error: profileError } = await client
    .from('artisan_makers')
    .select(
      '*, sculpts:artisan_sculpts (*, total_colorways:artisan_colorways(count))',
    )
    .eq('id', makerId)
    .eq('sculpts.deleted', false)
    .single()

  if (profileError) {
    throw createError({
      statusCode: 404,
      statusMessage: profileError.message,
    })
  }

  /**
   * Using database filters for pagination with large datasets
   */
  let request = client
    .from('artisan_colorways')
    .select()
    .eq('maker_id', makerId)

  if (query.sculpt) {
    request = request.eq('sculpt_id', query.sculpt)
  }

  if (query.order_by) {
    request = request.order(query.order_by, { ascending })
  }

  if (query.from !== undefined && query.to !== undefined) {
    request = request.range(query.from, query.to)
  }

  const { data: colorways, error: colorwaysError } = await request

  if (colorwaysError) {
    throw createError({
      statusCode: 500,
      statusMessage: colorwaysError.message,
    })
  }

  const colorwayMap = groupBy(colorways?.map(omitSensitive), 'sculpt_id')

  let selectedColorwayIndex = -1

  if (query.sculpt && query.cid) {
    let selectedColorwayRequest = client
      .from('artisan_colorways')
      .select('colorway_id')
      .eq('maker_id', makerId)
      .eq('sculpt_id', query.sculpt)

    if (query.order_by) {
      selectedColorwayRequest = selectedColorwayRequest.order(query.order_by, {
        ascending,
      })
    }

    const { data: selectedColorwayIds, error: selectedColorwayError } =
      await selectedColorwayRequest

    if (selectedColorwayError) {
      throw createError({
        statusCode: 500,
        statusMessage: selectedColorwayError.message,
      })
    }

    selectedColorwayIndex = selectedColorwayIds.findIndex(
      ({ colorway_id }) => colorway_id === query.cid,
    )
  }

  if (!profile) return

  const sculpts = profile.sculpts.map((sculpt: any) => {
    sculpt.total_colorways = sculpt.total_colorways[0]?.count
    sculpt.colorways = colorwayMap[sculpt.sculpt_id] || []

    return omitSensitive(sculpt)
  })

  profile.sculpts = keyBy(sortSculpts(sculpts), 'sculpt_id')
  profile.selected_colorway_index = selectedColorwayIndex

  // Fallback for makers with disabled Google sync: use the highest-order colorway image as sculpt image.
  if (profile.disable_google_sync) {
    Object.values(profile.sculpts).forEach((sculpt: any) => {
      if (sculpt.colorways && sculpt.colorways.length > 0) {
        const latestColorway = sculpt.colorways.reduce(
          (latest: any, current: any) => {
            const latestOrder = latest.order ?? -Infinity
            const currentOrder = current.order ?? -Infinity
            return currentOrder > latestOrder ? current : latest
          },
        )
        sculpt.img = latestColorway.img
      }
    })
  }

  return omitSensitive(profile)
})
