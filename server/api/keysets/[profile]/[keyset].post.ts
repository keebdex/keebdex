import {
  canManageAnyAssignment,
  canManageAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { profile: profileId, keyset: keysetSlug } = getRouterParams(event)
  const { client, user, profile } = await getActorProfile(event)
  const body = pickTableFields('keysets', await readBody(event))

  const isStaff =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, `${profileId}/${keysetSlug}`)

  // Only staff may set moderation fields; a submitter editing their own
  // rejected keyset sends it back to review.
  const payload = isStaff
    ? body
    : {
        ...omitModerationFields(body),
        ...(body.id
          ? await getOwnResubmission(
              client,
              'keysets',
              { id: body.id as number },
              user.sub,
              false,
            )
          : getSubmissionAttribution(false, user.sub)),
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
