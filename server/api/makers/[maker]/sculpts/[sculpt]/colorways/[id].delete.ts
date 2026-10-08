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
  const match = { maker_id: maker!, sculpt_id: sculpt! }

  await deleteChildSubmission({
    client,
    table: 'artisan_colorways',
    match: { ...match, id },
    label: 'colorway',
  })

  // A sculpt under review with no colorways left has nothing to review anymore.
  if (!isOfficial && parent.review_status) {
    await deleteParentIfEmpty(
      client,
      { table: 'artisan_sculpts', match: { maker_sculpt_id: makerSculptId } },
      { table: 'artisan_colorways', match },
    )
  }

  return { success: true }
})
