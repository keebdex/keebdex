import {
  canManageAnyAssignment,
  canManageAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { profile: profileId, keyset: keysetSlug } = getRouterParams(event)
  const { client, user, profile } = await getActorProfile(event)
  // The database builds profile_keyset_id from profile_id and slug.
  const rawBody = await readBody(event)
  const body = pickTableFields('keysets', rawBody, [
    'profile_keyset_id',
    ...MODERATION_FIELDS,
  ])

  const isStaff =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, `${profileId}/${keysetSlug}`)

  // Staff set the Review Status from the form; the server writes the rest.
  const moderation = await getPageSaveModeration({
    client,
    table: 'keysets',
    id: body.id,
    status: rawBody?.review_status,
    userId: user.sub,
    isStaff,
  })
  const payload = { ...body, ...moderation }

  // Publishing the keyset here mustn't publish its status-less kits unreviewed.
  if (body.id && moderation.review_status === 'Approved') {
    await keepChildrenInReviewOnPublish(
      client,
      { table: 'keysets', match: { id: body.id as number } },
      (keyset) => [
        {
          table: 'keyset_kits',
          match: { profile_keyset_id: keyset.profile_keyset_id },
        },
      ],
    )
  }

  const { data, error } = body.id
    ? await client
        .from('keysets')
        .update(payload)
        .eq('id', body.id as number)
        .select('id')
    : await client.from('keysets').insert(payload as any)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  // RLS filters rows silently, so an empty update result means it was refused.
  if (body.id && !data?.length) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can't edit this keyset in its current state",
    })
  }

  return data
})
