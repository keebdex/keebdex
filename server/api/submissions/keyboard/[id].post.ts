import { createError, defineEventHandler, readBody } from 'h3'
import { getActorProfile } from '../../../utils/admin'
import { toNullableNumber } from '../../../utils'
import {
  canManageAssignment,
  canManageAnyAssignment,
} from '~/utils/permissions'

const ALLOWED_ACTIONS = new Set(['approve', 'reject', 'update'])

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing keyboard id' })
  }

  const body = await readBody(event)
  const action = String(body?.action || 'update').trim()

  if (!ALLOWED_ACTIONS.has(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
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

  if (action !== 'update' && !isModerator) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (action === 'update') {
    if (!isModerator && !(isOwner && existing.review_status === 'Pending')) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  const editableFields = pickTableFields('keyboards', body?.keyboard || {})
  const payload: Record<string, unknown> = {
    ...editableFields,
    typing_angle: toNullableNumber(editableFields.typing_angle),
  }

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
    .from('keyboards')
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

  const releasesInput = Array.isArray(body?.releases) ? body.releases : null

  if (releasesInput) {
    const { data: currentReleases } = await client
      .from('keyboard_releases')
      .select('id')
      .eq('brand_keyboard_slug', existing.brand_keyboard_slug)

    const keptReleaseIds = releasesInput
      .map((release: any) => release.id)
      .filter((releaseId: unknown) => !!releaseId)
    const removedReleaseIds = (currentReleases || [])
      .map((release) => release.id)
      .filter((releaseId) => !keptReleaseIds.includes(releaseId))

    if (removedReleaseIds.length) {
      await client
        .from('keyboard_variants')
        .delete()
        .in('release_id', removedReleaseIds)
      await client
        .from('keyboard_releases')
        .delete()
        .in('id', removedReleaseIds)
    }

    for (const release of releasesInput) {
      const releasePayload = {
        ...pickTableFields('keyboard_releases', release),
        release_year: toNullableNumber(release.release_year),
        msrp_price: toNullableNumber(release.msrp_price),
        brand_slug: existing.brand_slug,
        brand_keyboard_slug: existing.brand_keyboard_slug,
      }

      let releaseId = release.id

      if (releaseId) {
        await client
          .from('keyboard_releases')
          .update(releasePayload)
          .eq('id', releaseId)
      } else {
        const { data: createdRelease, error: createReleaseError } = await client
          .from('keyboard_releases')
          .insert(releasePayload)
          .select()
          .single()

        if (createReleaseError) {
          throw createError({
            statusCode: 500,
            statusMessage: createReleaseError.message,
          })
        }

        releaseId = createdRelease.id
      }

      const variantsInput = Array.isArray(release.variants)
        ? release.variants
        : []

      const { data: currentVariants } = await client
        .from('keyboard_variants')
        .select('id')
        .eq('release_id', releaseId)

      const keptVariantIds = variantsInput
        .map((variant: any) => variant.id)
        .filter((variantId: unknown) => !!variantId)
      const removedVariantIds = (currentVariants || [])
        .map((variant) => variant.id)
        .filter((variantId) => !keptVariantIds.includes(variantId))

      if (removedVariantIds.length) {
        await client
          .from('keyboard_variants')
          .delete()
          .in('id', removedVariantIds)
      }

      for (const variant of variantsInput) {
        const variantPayload = {
          ...pickTableFields('keyboard_variants', variant),
          release_id: releaseId,
          brand_slug: existing.brand_slug,
          brand_keyboard_slug: existing.brand_keyboard_slug,
        }

        if (variant.id) {
          await client
            .from('keyboard_variants')
            .update(variantPayload)
            .eq('id', variant.id)
        } else {
          await client.from('keyboard_variants').insert(variantPayload)
        }
      }
    }
  }

  return data
})
