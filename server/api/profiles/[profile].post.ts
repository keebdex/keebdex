/**
 * Creates or updates a keyset profile (`saveOwnerSubmission`): staff add
 * published profiles, everyone else proposes one for review; the route param
 * is the profile_id.
 */
export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'profile')!

  return omitSensitive(
    await saveOwnerSubmission(
      event,
      'keyset',
      profileId,
      pickTableFields('keyset_profiles', await readBody(event)),
    ),
  )
})
