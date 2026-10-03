export default defineEventHandler(async (event) => {
  const { maker, sculpt, id } = getRouterParams(event)
  const makerSculptId = `${maker}/${sculpt}`

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing colorway id' })
  }

  const { client, parent, isOfficial } = await getChildSubmissionContext(
    event,
    'artisan',
    makerSculptId,
  )

  const { data, error } = await client
    .from('artisan_colorways')
    .delete()
    .eq('id', id)
    .eq('maker_id', maker)
    .eq('sculpt_id', sculpt)
    .select('id')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // RLS filters rows silently, so an empty result means nothing was allowed.
  if (!data?.length) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can't delete this colorway in its current state",
    })
  }

  // A sculpt under review with no colorways left has nothing to review anymore.
  if (!isOfficial && parent.review_status) {
    const { count } = await client
      .from('artisan_colorways')
      .select('id', { count: 'exact', head: true })
      .eq('maker_id', maker)
      .eq('sculpt_id', sculpt)

    if (!count) {
      const { error: sculptError } = await client
        .from('artisan_sculpts')
        .delete()
        .eq('maker_sculpt_id', makerSculptId)

      if (sculptError) {
        throw createError({
          statusCode: 500,
          statusMessage: sculptError.message,
        })
      }
    }
  }

  return { success: true }
})
