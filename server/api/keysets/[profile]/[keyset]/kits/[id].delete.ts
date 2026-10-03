export default defineEventHandler(async (event) => {
  const { id, profile, keyset } = getRouterParams(event)
  const profileKeysetId = `${profile}/${keyset}`

  const { client, parent, isOfficial } = await getChildSubmissionContext(
    event,
    'keyset',
    profileKeysetId,
  )

  const { data, error } = await client
    .from('keyset_kits')
    .delete()
    .eq('id', id)
    .eq('profile_keyset_id', profileKeysetId)
    .select('id')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // RLS filters rows silently, so an empty result means nothing was allowed.
  if (!data?.length) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can't delete this kit in its current state",
    })
  }

  // A keyset under review with no kits left has nothing to review anymore.
  if (!isOfficial && parent.review_status) {
    const { count } = await client
      .from('keyset_kits')
      .select('id', { count: 'exact', head: true })
      .eq('profile_keyset_id', profileKeysetId)

    if (!count) {
      const { error: keysetError } = await client
        .from('keysets')
        .delete()
        .eq('profile_keyset_id', profileKeysetId)

      if (keysetError) {
        throw createError({
          statusCode: 500,
          statusMessage: keysetError.message,
        })
      }
    }
  }

  return { success: true }
})
