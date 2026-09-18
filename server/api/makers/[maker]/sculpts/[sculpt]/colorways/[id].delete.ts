export default defineEventHandler(async (event) => {
  const { client, profile } = await getActorProfile(event)
  const { maker, sculpt, id } = event.context.params || {}

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing colorway id' })
  }

  if (!canModerateAssignment(profile, String(maker || ''))) {
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
