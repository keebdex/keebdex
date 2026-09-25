import { createError, defineEventHandler, readBody } from 'h3'
import slugify from 'slugify'
import { getActorProfile } from '../../utils/admin'
import {
  canManageAssignment,
  canManageAnyAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)

  const body = await readBody(event)
  const keysetInput = pickTableFields('keysets', body?.keyset || {})
  const kitsInput = Array.isArray(body?.kits) ? body.kits : []

  if (!keysetInput.name || !keysetInput.profile_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing keyset name or profile',
    })
  }

  const slug = slugify(String(keysetInput.name), { lower: true })
  const profile_keyset_id = `${keysetInput.profile_id}/${slug}`

  // Staff submitting through the community form don't need to self-approve.
  const isModerator =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, profile_keyset_id)

  const keysetPayload = {
    ...keysetInput,
    profile_keyset_id,
    review_status: isModerator ? 'Approved' : 'Pending',
    submitted_by: user.sub,
    verified_at: isModerator ? new Date().toISOString() : null,
    verified_by: isModerator ? user.sub : null,
  }

  const { data: keyset, error: keysetError } = await client
    .from('keysets')
    .insert(keysetPayload)
    .select()
    .single()

  if (keysetError) {
    throw createError({ statusCode: 500, statusMessage: keysetError.message })
  }

  if (kitsInput.length) {
    const kitsPayload = kitsInput.map((kit: unknown) => ({
      ...pickTableFields('keyset_kits', kit),
      profile_keyset_id,
    }))

    const { error: kitsError } = await client
      .from('keyset_kits')
      .insert(kitsPayload)

    if (kitsError) {
      throw createError({ statusCode: 500, statusMessage: kitsError.message })
    }
  }

  return keyset
})
