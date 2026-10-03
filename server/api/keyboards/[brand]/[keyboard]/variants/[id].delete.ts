export default defineEventHandler(async (event) => {
  const { id, brand, keyboard } = getRouterParams(event)
  const brandKeyboardSlug = `${brand}/${keyboard}`

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Variant ID is required',
    })
  }

  const { client, parent, isOfficial } = await getChildSubmissionContext(
    event,
    'keyboard',
    brandKeyboardSlug,
  )

  const { data, error } = await client
    .from('keyboard_variants')
    .delete()
    .eq('id', id)
    .eq('brand_keyboard_slug', brandKeyboardSlug)
    .select('release_id')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // RLS filters rows silently, so an empty result means nothing was allowed.
  if (!data?.length) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can't delete this variant in its current state",
    })
  }

  const releaseId = data[0]!.release_id

  // A release under review with no variants left has nothing to review anymore,
  // and neither does a keyboard under review with no releases left.
  const { data: release } = await client
    .from('keyboard_releases')
    .select('review_status')
    .eq('id', releaseId)
    .maybeSingle()

  const releaseUnderReview =
    !!release &&
    (release.review_status
      ? release.review_status !== 'Approved'
      : !isOfficial && !!parent.review_status)

  if (!releaseUnderReview) return { success: true }

  const { count: variantCount } = await client
    .from('keyboard_variants')
    .select('id', { count: 'exact', head: true })
    .eq('release_id', releaseId)

  if (variantCount) return { success: true }

  const { error: releaseError } = await client
    .from('keyboard_releases')
    .delete()
    .eq('id', releaseId)

  if (releaseError) {
    throw createError({ statusCode: 500, statusMessage: releaseError.message })
  }

  if (isOfficial || !parent.review_status) return { success: true }

  const { count: releaseCount } = await client
    .from('keyboard_releases')
    .select('id', { count: 'exact', head: true })
    .eq('brand_keyboard_slug', brandKeyboardSlug)

  if (!releaseCount) {
    const { error: keyboardError } = await client
      .from('keyboards')
      .delete()
      .eq('brand_keyboard_slug', brandKeyboardSlug)

    if (keyboardError) {
      throw createError({
        statusCode: 500,
        statusMessage: keyboardError.message,
      })
    }
  }

  return { success: true }
})
