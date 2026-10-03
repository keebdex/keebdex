export default defineEventHandler(async (event) => {
  const { profile, keyset } = getRouterParams(event)
  const profileKeysetId = `${profile}/${keyset}`

  const { client, user, parent, isStaff, attribute } =
    await getChildSubmissionContext(event, 'keyset', profileKeysetId)
  const body = await readBody(event)
  const kit = pickTableFields('keyset_kits', body)
  // Staff reviewing a kit can approve/reject it while saving.
  const moderation = getModerationOverride(body?.action, user.sub, isStaff)

  if (kit.id) {
    const payload: Record<string, unknown> = {
      ...omitModerationFields(kit),
      ...moderation,
      profile_keyset_id: profileKeysetId,
    }

    // Editing your own rejected kit sends it (and its keyset) back to review.
    let resubmitted = false

    if (!isStaff) {
      const { data: current } = await client
        .from('keyset_kits')
        .select('review_status, submitted_by')
        .eq('id', kit.id as number)
        .eq('profile_keyset_id', profileKeysetId)
        .maybeSingle()

      if (
        current?.submitted_by === user.sub &&
        current.review_status === 'Rejected'
      ) {
        Object.assign(payload, {
          review_status: 'Pending',
          verified_at: null,
          verified_by: null,
        })
        resubmitted = true
      }
    }

    const { data, error } = await client
      .from('keyset_kits')
      .update(payload)
      .eq('id', kit.id as number)
      .eq('profile_keyset_id', profileKeysetId)
      .select('id')

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    if (!data?.length) {
      throw createError({
        statusCode: 403,
        statusMessage: "You can't edit this kit in its current state",
      })
    }

    if (resubmitted && parent.review_status === 'Rejected') {
      const { error: resubmitError } = await client
        .from('keysets')
        .update({
          review_status: 'Pending',
          verified_at: null,
          verified_by: null,
        })
        .eq('profile_keyset_id', profileKeysetId)

      if (resubmitError) {
        throw createError({
          statusCode: 500,
          statusMessage: resubmitError.message,
        })
      }
    }
  } else {
    const { error } = await client.from('keyset_kits').insert({
      ...attribute({ ...kit, profile_keyset_id: profileKeysetId }),
      ...moderation,
    })

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }
  }

  if (moderation) {
    await cascadeKeysetReview(client, profileKeysetId, body.action, user.sub)
  }

  return { success: true }
})
