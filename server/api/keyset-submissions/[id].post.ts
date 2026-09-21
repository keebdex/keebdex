import { createError, defineEventHandler, readBody } from 'h3'
import { getActorProfile } from '../../utils/admin'
import {
  canManageAssignment,
  canManageAnyAssignment,
} from '~/utils/permissions'

const ALLOWED_ACTIONS = new Set(['approve', 'reject', 'update'])

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing keyset id' })
  }

  const body = await readBody(event)
  const action = String(body?.action || 'update').trim()

  if (!ALLOWED_ACTIONS.has(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
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

  if (action !== 'update' && !isModerator) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (action === 'update') {
    if (!isModerator && !(isOwner && existing.review_status === 'Pending')) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  const editableFields = pickTableFields('keysets', body?.keyset || {})
  const payload: Record<string, unknown> = { ...editableFields }

  if (action === 'approve') {
    payload.review_status = 'Approved'
    payload.verified_by = user.sub
    payload.verified_at = new Date().toISOString()
  } else if (action === 'reject') {
    payload.review_status = 'Rejected'
    payload.verified_by = user.sub
    payload.verified_at = new Date().toISOString()
  }

  const { data, error } = await client
    .from('keysets')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const kitsInput = Array.isArray(body?.kits) ? body.kits : null

  if (kitsInput) {
    const { data: currentKits } = await client
      .from('keyset_kits')
      .select('id')
      .eq('profile_keyset_id', existing.profile_keyset_id)

    const keptIds = kitsInput
      .map((kit: any) => kit.id)
      .filter((kitId: unknown) => !!kitId)
    const removedIds = (currentKits || [])
      .map((kit) => kit.id)
      .filter((kitId) => !keptIds.includes(kitId))

    if (removedIds.length) {
      await client.from('keyset_kits').delete().in('id', removedIds)
    }

    for (const kit of kitsInput) {
      const kitPayload = {
        ...pickTableFields('keyset_kits', kit),
        profile_keyset_id: existing.profile_keyset_id,
      }

      if (kit.id) {
        await client.from('keyset_kits').update(kitPayload).eq('id', kit.id)
      } else {
        await client.from('keyset_kits').insert(kitPayload)
      }
    }
  }

  return data
})
