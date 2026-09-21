import { createError, defineEventHandler } from 'h3'
import { getActorProfile } from '../../utils/admin'
import { omitSensitive } from '../../utils'
import {
  canManageAssignment,
  canManageAnyAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing keyset id' })
  }

  const { data, error } = await client
    .from('keysets')
    .select(
      '*, profile:keyset_profiles(name), kits:keyset_kits(*, category:kit_categories(name))',
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Keyset not found' })
  }

  const isOwner = data.submitted_by === user.sub
  const isModerator =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, data.profile_keyset_id)

  if (!isOwner && !isModerator) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return omitSensitive(data)
})
