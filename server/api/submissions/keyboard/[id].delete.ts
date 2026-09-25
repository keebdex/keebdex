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
    throw createError({ statusCode: 400, statusMessage: 'Missing keyboard id' })
  }

  const { data: existing, error: existingError } = await client
    .from('keyboards')
    .select('id, brand_slug, brand_keyboard_slug, submitted_by, review_status')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Keyboard not found' })
  }

  const isOwner = existing.submitted_by === user.sub
  const isModerator =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, existing.brand_slug)

  const canDelete =
    isModerator || (isOwner && existing.review_status !== 'Approved')

  if (!canDelete) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { data: releases } = await client
    .from('keyboard_releases')
    .select('id')
    .eq('brand_keyboard_slug', existing.brand_keyboard_slug)

  const releaseIds = (releases || []).map((release) => release.id)

  if (releaseIds.length) {
    await client.from('keyboard_variants').delete().in('release_id', releaseIds)
  }

  await client
    .from('keyboard_releases')
    .delete()
    .eq('brand_keyboard_slug', existing.brand_keyboard_slug)

  const { error } = await client.from('keyboards').delete().eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true }
})
