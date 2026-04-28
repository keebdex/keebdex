import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../../../../utils'

export default defineEventHandler(async (event) => {
  const { maker: makerId, sculpt: sculptId } = event.context.params || {}
  const query: Record<string, any> = getQuery(event)
  const ascending = query.sort === 'asc'

  const client = await serverSupabaseClient(event)
  const { data: profile, error: profileError } = await client
    .from('artisan_makers')
    .select(
      'name, invertible_logo, sculpts:artisan_sculpts (*, total_colorways:artisan_colorways(count))',
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

  let request = client
    .from('artisan_colorways')
    .select()
    .eq('maker_id', makerId)
    .eq('sculpt_id', sculptId)

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

  let selectedColorwayIndex = -1

  if (query.cid) {
    let selectedColorwayRequest = client
      .from('artisan_colorways')
      .select('colorway_id')
      .eq('maker_id', makerId)
      .eq('sculpt_id', sculptId)

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
    return omitSensitive(sculpt)
  })

  const sculpt = sculpts.find(
    (currentSculpt: any) => currentSculpt.sculpt_id === sculptId,
  )

  if (!sculpt) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Sculpt not found',
    })
  }

  sculpt.colorways = colorways?.map(omitSensitive) || []
  sculpt.maker_name = profile.name
  sculpt.invertible_logo = profile.invertible_logo
  sculpt.selected_colorway_index = selectedColorwayIndex
  sculpt.maker_sculpts = sculpts.map(({ colorways, ...rest }: any) => rest)

  return sculpt
})
