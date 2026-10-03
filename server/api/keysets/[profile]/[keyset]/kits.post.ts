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
  // Staff reviewing a proposal can approve/reject it while saving.
  const moderation = getModerationOverride(body?.action, user.sub, isStaff)

  // Edits keep their existing moderation state; new kits get attributed.
  const query = kit.id
    ? client
        .from('keyset_kits')
        .update({
          ...omitModerationFields(kit),
          ...moderation,
          profile_keyset_id: profileKeysetId,
        })
        .eq('id', kit.id as number)
        .eq('profile_keyset_id', profileKeysetId)
    : client.from('keyset_kits').insert({
        ...attribute({ ...kit, profile_keyset_id: profileKeysetId }),
        ...moderation,
      })

  const { data, error } = await query

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
