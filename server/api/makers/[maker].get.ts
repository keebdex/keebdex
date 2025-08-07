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

  const client = await serverSupabaseClient(event)
  const { data: profile } = await client
    .from('makers')
    .select('*, sculpts (*, total_colorways:colorways(count))')
    .eq('id', makerId)
    .single()

  /**
   * Using database filters for pagination with large datasets
   */
  const { data: colorways } = await client
    .from('colorways')
    .select()
    // .select('*, keycap:keycaps(*)')
    .eq('maker_id', makerId)
    .eq('sculpt_id', query.sculpt)
    .order(query.order_by, { ascending: query.sort === 'asc' })
    .range(query.from, query.to)

  const colorwayMap = groupBy(colorways?.map(omitSensitive), 'sculpt_id')

  if (!profile) return

  const sculpts = profile.sculpts.map((sculpt: any) => {
    sculpt.total_colorways = sculpt.total_colorways[0]?.count
    sculpt.colorways = colorwayMap[sculpt.sculpt_id] || []

    return omitSensitive(sculpt)
  })

  profile.sculpts = keyBy(sortSculpts(sculpts), 'sculpt_id')

  return omitSensitive(profile)
})
