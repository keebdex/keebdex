export default defineEventHandler(async (event) => {
  const { maker, sculpt, id } = getRouterParams(event)
  const makerSculptId = `${maker}/${sculpt}`

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing colorway id' })
  }

  const { client, parent, isOfficial, isStaff } =
    await getChildSubmissionContext(event, 'artisan', makerSculptId)
  const match = { maker_id: maker!, sculpt_id: sculpt! }

  await deleteChildSubmission({
    client,
    table: 'artisan_colorways',
    match: { ...match, id },
    label: 'colorway',
    note: await readDeletionNote(event, isStaff),
  })

  // A sculpt under review with no colorways left has nothing to review
  // anymore, and neither does a maker under review with no sculpts left.
  if (!isOfficial && parent.review_status) {
    const sculptDeleted = await deleteParentIfEmpty(
      client,
      { table: 'artisan_sculpts', match: { maker_sculpt_id: makerSculptId } },
      { table: 'artisan_colorways', match },
    )

    if (sculptDeleted) await deleteOwnerIfEmpty(client, 'artisan', maker!)
  }

  return { success: true }
})
