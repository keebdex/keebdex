export default defineEventHandler(async (event) => {
  const { id, brand, keyboard } = getRouterParams(event)
  const brandKeyboardSlug = `${brand}/${keyboard}`

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Variant ID is required',
    })
  }

  const { client, parent, isOfficial, isStaff } =
    await getChildSubmissionContext(event, 'keyboard', brandKeyboardSlug)
  const keyboardUnderReview = !isOfficial && !!parent.review_status
  const keyboardMatch = { brand_keyboard_slug: brandKeyboardSlug }

  const { release_id: releaseId } = await deleteChildSubmission({
    client,
    table: 'keyboard_variants',
    match: { ...keyboardMatch, id },
    label: 'variant',
    note: await readDeletionNote(event, isStaff),
    select: 'release_id',
  })

  // A release under review with no variants left has nothing to review
  // anymore, and neither does a keyboard under review with no releases left.
  // A release without a status of its own follows its keyboard.
  const { data: release } = await client
    .from('keyboard_releases')
    .select('review_status')
    .eq('id', releaseId)
    .maybeSingle()

  const releaseUnderReview =
    !!release &&
    (release.review_status
      ? release.review_status !== 'Approved'
      : keyboardUnderReview)

  if (!releaseUnderReview) return { success: true }

  const releaseDeleted = await deleteParentIfEmpty(
    client,
    { table: 'keyboard_releases', match: { id: releaseId } },
    { table: 'keyboard_variants', match: { release_id: releaseId } },
  )

  if (releaseDeleted && keyboardUnderReview) {
    await deleteParentIfEmpty(
      client,
      { table: 'keyboards', match: keyboardMatch },
      { table: 'keyboard_releases', match: keyboardMatch },
    )
  }

  return { success: true }
})
