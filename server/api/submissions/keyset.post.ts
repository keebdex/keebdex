import { createError, defineEventHandler, readBody } from 'h3'
import { getActorProfile } from '../../utils/admin'
import { urlSlugify } from '~/utils/slug'
import {
  canManageAssignment,
  canManageAnyAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)

  const body = await readBody(event)
  // The database builds profile_keyset_id from profile_id and slug.
  const keysetInput = pickTableFields('keysets', body?.keyset || {}, [
    'profile_keyset_id',
  ])

  if (!keysetInput.name || !keysetInput.profile_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing keyset name or profile',
    })
  }

  const slug = urlSlugify(String(keysetInput.name))

  // Staff submitting through the community form don't need to self-approve.
  const isModerator =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, `${keysetInput.profile_id}/${slug}`)

  const keysetPayload = {
    ...keysetInput,
    slug,
    ...getSubmissionAttribution(isModerator, user.sub),
  }

  const { data: keyset, error: keysetError } = await client
    .from('keysets')
    .insert(keysetPayload)
    .select()
    .single()

  if (keysetError) {
    throw createError({ statusCode: 500, statusMessage: keysetError.message })
  }

  return keyset
})
