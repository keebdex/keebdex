import { serverSupabaseClient } from '#supabase/server'
import { keyBy } from 'es-toolkit'
import { sortBy } from 'es-toolkit/compat'
import { PUBLISHED_FILTER, omitSensitive } from '../../utils'

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

function getLatestColorway(colorways: any[] = []) {
  return colorways.reduce((latest: any, current: any) => {
    const latestOrder = latest.order ?? -Infinity
    const currentOrder = current.order ?? -Infinity
    return currentOrder > latestOrder ? current : latest
  }, colorways[0])
}

export default defineEventHandler(async (event) => {
  const makerId = event.context.params?.maker

  const client = await serverSupabaseClient(event)
  const { data: profile, error: profileError } = await client
    .from('artisan_makers')
    .select(
      '*, sculpts:artisan_sculpts (*, total_colorways:artisan_colorways(count), colorways:artisan_colorways(img, order, created_at))',
    )
    .eq('maker_id', makerId)
    .eq('sculpts.deleted', false)
    .or(PUBLISHED_FILTER, { referencedTable: 'sculpts.total_colorways' })
    .or(PUBLISHED_FILTER, { referencedTable: 'sculpts.colorways' })
    .order('order', {
      ascending: false,
      referencedTable: 'sculpts.colorways',
    })
    .order('created_at', {
      ascending: false,
      referencedTable: 'sculpts.colorways',
    })
    .limit(5, { referencedTable: 'sculpts.colorways' })
    .single()

  if (profileError) {
    throw createError({
      statusCode: 404,
      statusMessage: profileError.message,
    })
  }

  if (!profile) return

  const sculpts = profile.sculpts.map((sculpt: any) => {
    sculpt.total_colorways = sculpt.total_colorways[0]?.count

    // The sculpt card's cover: the latest of its newest published colorways
    // that has an image
    const withImage = (sculpt.colorways || []).filter((c: any) => c.img)
    sculpt.img = getLatestColorway(withImage)?.img ?? null

    delete sculpt.colorways

    return omitSensitive(sculpt)
  })

  profile.sculpts = keyBy(sortSculpts(sculpts), (s) => s.sculpt_id)

  return omitSensitive(profile)
})
