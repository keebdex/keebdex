export default defineEventHandler(async (event) => {
  const { profile, keyset } = getRouterParams(event)
  const profileKeysetId = `${profile}/${keyset}`

  const { client, user, isStaff, attribute } = await getChildSubmissionContext(
    event,
    'keyset',
    profileKeysetId,
  )
  const body = await readBody(event)
  const kit = pickTableFields('keyset_kits', body)
  // Staff reviewing a kit can approve/reject it while saving.
  const moderation = getModerationOverride(body?.action, user.sub, isStaff)

  if (kit.id) {
    const { resubmitted } = await updateChildSubmission({
      client,
      table: 'keyset_kits',
      match: { id: kit.id as number, profile_keyset_id: profileKeysetId },
      payload: {
        ...omitModerationFields(kit),
        ...moderation,
        profile_keyset_id: profileKeysetId,
      },
      userId: user.sub,
      isStaff,
      label: 'kit',
    })

    // Editing your own rejected kit sends its rejected keyset back too.
    if (resubmitted) {
      await resubmitRejectedParent(client, 'keysets', {
        profile_keyset_id: profileKeysetId,
      })
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
