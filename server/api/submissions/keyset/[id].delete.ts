import { createError, defineEventHandler } from 'h3'
import { getActorProfile } from '../../../utils/admin'
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

  const { data: existing, error: existingError } = await client
    .from('keysets')
    .select('id, profile_keyset_id, submitted_by, review_status')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Keyset not found' })
  }

  const isOwner = existing.submitted_by === user.sub
  const isModerator =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, existing.profile_keyset_id)

  const canDelete =
    isModerator || (isOwner && existing.review_status !== 'Approved')

  if (!canDelete) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  await client
    .from('keyset_kits')
    .delete()
    .eq('profile_keyset_id', existing.profile_keyset_id)

  const { error } = await client.from('keysets').delete().eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true }
})
