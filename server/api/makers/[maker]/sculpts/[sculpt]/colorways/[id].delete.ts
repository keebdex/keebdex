export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const { maker, sculpt, id } = event.context.params || {}

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing colorway id' })
  }

  const { data: existing, error: existingError } = await client
    .from('artisan_colorways')
    .select('submitted_by, status')
    .eq('id', id)
    .eq('maker_id', maker)
    .eq('sculpt_id', sculpt)
    .single()

  if (existingError || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Colorway not found' })
  }

  const isModerator = canModerateAssignment(profile, String(maker || ''))
  // The submitter may delete their own submission unless it's already approved.
  const isOwnerDeletable =
    existing.submitted_by === user.sub && existing.status !== 'Approved'

  if (!isModerator && !isOwnerDeletable) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { error } = await client
    .from('artisan_colorways')
    .delete()
    .eq('id', id)
    .eq('maker_id', maker)
    .eq('sculpt_id', sculpt)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return { success: true }
})
