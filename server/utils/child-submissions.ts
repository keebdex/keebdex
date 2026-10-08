import { createError } from 'h3'
import type { H3Event } from 'h3'
import omit from 'lodash.omit'
import { getActorProfile } from './admin'
import {
  canManageAnyAssignment,
  canManageAssignment,
} from '~/utils/permissions'

export type ChildSubmissionDomain = 'keyset' | 'keyboard' | 'artisan'

const MODERATION_FIELDS = [
  'review_status',
  'submitted_by',
  'verified_at',
  'verified_by',
]

/**
 * Child payloads come from the client, so moderation fields are always dropped
 * here and re-applied server-side by `getChildSubmissionContext().attribute`.
 */
export const omitModerationFields = <T extends Record<string, unknown>>(
  record: T,
) => omit(record, MODERATION_FIELDS) as Partial<T>

/**
 * Resolves who is adding/editing a kit, release, variant, or colorway on an
 * existing keyset/keyboard/sculpt (`parentKey` is `profile_keyset_id`,
 * `brand_keyboard_slug`, or `maker_sculpt_id`), and what moderation state a
 * newly created child gets:
 * - official (null/Approved) parent + staff for it: auto-approved;
 * - official parent + anyone else: a Pending community proposal;
 * - Pending/Rejected keyset or sculpt: kits/colorways still get their own
 *   status (see above);
 * - Pending/Rejected keyboard: releases have no state of their own (the
 *   keyboard's lifecycle owns them), but variants still get their own.
 */
export const getChildSubmissionContext = async (
  event: H3Event,
  domain: ChildSubmissionDomain,
  parentKey: string,
) => {
  const { client, user, profile } = await getActorProfile(event)

  const parentQuery =
    domain === 'keyset'
      ? client
          .from('keysets')
          .select('profile_keyset_id, review_status, submitted_by')
          .eq('profile_keyset_id', parentKey)
          .maybeSingle()
      : domain === 'keyboard'
        ? client
            .from('keyboards')
            .select(
              'brand_slug, brand_keyboard_slug, review_status, submitted_by',
            )
            .eq('brand_keyboard_slug', parentKey)
            .maybeSingle()
        : client
            .from('artisan_sculpts')
            .select('maker_id, sculpt_id, review_status, submitted_by')
            .eq('maker_sculpt_id', parentKey)
            .maybeSingle()

  const { data: parent, error } = await parentQuery

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!parent) {
    throw createError({
      statusCode: 404,
      statusMessage: {
        keyset: 'Keyset not found',
        keyboard: 'Keyboard not found',
        artisan: 'Sculpt not found',
      }[domain],
    })
  }

  const scope =
    'profile_keyset_id' in parent
      ? parent.profile_keyset_id
      : 'brand_slug' in parent
        ? parent.brand_slug
        : parent.maker_id
  const isStaff =
    canManageAnyAssignment(profile) && canManageAssignment(profile, scope)
  const isOfficial =
    !parent.review_status || parent.review_status === 'Approved'

  // `own` children (keyset kits, keyboard variants, artisan colorways) always
  // carry their own status so each can be reviewed alone; others (keyboard
  // releases) follow a Pending parent's lifecycle.
  const attribute = <T extends Record<string, unknown>>(
    record: T,
    { own = domain !== 'keyboard' }: { own?: boolean } = {},
  ) => {
    const base = omitModerationFields(record)

    if (!isOfficial && !own) return base

    return {
      ...base,
      review_status: isStaff ? 'Approved' : 'Pending',
      submitted_by: user.sub,
      verified_at: isStaff ? new Date().toISOString() : null,
      verified_by: isStaff ? user.sub : null,
    }
  }

  return {
    client,
    user,
    profile,
    parent,
    isStaff,
    isOfficial,
    attribute,
  }
}

/**
 * Moderation columns applied when staff send `action: 'approve' | 'reject'`
 * with a kit/release/variant/colorway save. Returns null when no action was
 * sent and rejects non-staff or unknown actions.
 */
export const getModerationOverride = (
  action: unknown,
  userId: string,
  isStaff: boolean,
) => {
  if (action === undefined || action === null || action === 'update') {
    return null
  }

  if (action !== 'approve' && action !== 'reject') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
  }

  if (!isStaff) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return {
    review_status: action === 'approve' ? 'Approved' : 'Rejected',
    verified_by: userId,
    verified_at: new Date().toISOString(),
  }
}

/**
 * Editing your own Rejected record sends it back to the Pending queue.
 */
export const getResubmissionPatch = () => ({
  review_status: 'Pending',
  verified_at: null,
  verified_by: null,
})

/**
 * Parents are listed through their children by filtering on a status that
 * ends up inside a PostgREST `or()` expression, so it must be whitelisted.
 */
export const parseReviewStatus = (value: unknown) => {
  const status = String(value || 'Pending').trim()

  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  return status
}

/**
 * Builds a PostgREST `column.in.(...)` condition with quoted values.
 */
export const inFilter = (column: string, values: string[]) =>
  `${column}.in.(${values.map((value) => `"${value.replace(/"/g, '')}"`).join(',')})`

/**
 * Approving a kit also approves its keyset when that keyset is still under
 * review (Pending/Rejected), like approving a colorway resolves its sculpt;
 * its status-less sibling kits become Pending instead of being published.
 * Rejecting a kit only rejects a Pending keyset once none of its kits is left
 * alive, so one rejected kit doesn't take down its siblings.
 */
export const cascadeKeysetReview = async (
  client: Awaited<ReturnType<typeof getActorProfile>>['client'],
  keysetKey: string,
  action: 'approve' | 'reject',
  userId: string,
) => {
  const { data: keyset } = await client
    .from('keysets')
    .select('review_status, submitted_by')
    .eq('profile_keyset_id', keysetKey)
    .maybeSingle()

  if (!keyset?.review_status || keyset.review_status === 'Approved') return

  // Kits without a status of their own follow their keyset, so publishing the
  // keyset would publish them unreviewed. Give them their own Pending status
  // first so they stay in the review queue and off the public keyset page.
  if (action === 'approve') {
    const { error: kitsError } = await client
      .from('keyset_kits')
      .update({
        review_status: 'Pending',
        submitted_by: keyset.submitted_by,
        verified_at: null,
        verified_by: null,
      })
      .eq('profile_keyset_id', keysetKey)
      .is('review_status', null)

    if (kitsError) {
      throw createError({ statusCode: 500, statusMessage: kitsError.message })
    }
  }

  if (action === 'reject') {
    if (keyset.review_status !== 'Pending') return

    const { count } = await client
      .from('keyset_kits')
      .select('id', { count: 'exact', head: true })
      .eq('profile_keyset_id', keysetKey)
      .or('review_status.is.null,review_status.neq.Rejected')

    if (count) return
  }

  const { error } = await client
    .from('keysets')
    .update({
      review_status: action === 'approve' ? 'Approved' : 'Rejected',
      verified_by: userId,
      verified_at: new Date().toISOString(),
    })
    .eq('profile_keyset_id', keysetKey)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

/**
 * Approving a colorway also approves its sculpt when that sculpt is still
 * under review (Pending/Rejected), as there's no separate moderation queue for
 * sculpts. Rejecting a colorway only rejects a Pending sculpt once none of its
 * colorways is left alive, so one rejected colorway doesn't take down its
 * siblings.
 */
export const cascadeSculptReview = async (
  client: Awaited<ReturnType<typeof getActorProfile>>['client'],
  makerId: string,
  sculptId: string,
  action: 'approve' | 'reject',
  userId: string,
) => {
  const { data: sculpt } = await client
    .from('artisan_sculpts')
    .select('review_status')
    .eq('maker_id', makerId)
    .eq('sculpt_id', sculptId)
    .maybeSingle()

  if (!sculpt?.review_status || sculpt.review_status === 'Approved') return

  if (action === 'reject') {
    if (sculpt.review_status !== 'Pending') return

    const { count } = await client
      .from('artisan_colorways')
      .select('id', { count: 'exact', head: true })
      .eq('maker_id', makerId)
      .eq('sculpt_id', sculptId)
      .or('review_status.is.null,review_status.neq.Rejected')

    if (count) return
  }

  const { error } = await client
    .from('artisan_sculpts')
    .update({
      review_status: action === 'approve' ? 'Approved' : 'Rejected',
      verified_by: userId,
      verified_at: new Date().toISOString(),
    })
    .eq('maker_id', makerId)
    .eq('sculpt_id', sculptId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

type Moderated = { review_status: string | null }

/**
 * Approving a variant also approves its release and keyboard while those are
 * under review (Pending/Rejected), like approving a colorway resolves its
 * sculpt. Rejecting a variant only rejects a Pending release/keyboard once none
 * of its variants is still alive, so one rejected variant doesn't take down its
 * siblings. Releases without a status of their own follow their keyboard.
 */
export const cascadeKeyboardReview = async (
  client: Awaited<ReturnType<typeof getActorProfile>>['client'],
  keyboardKey: string,
  releaseId: number,
  action: 'approve' | 'reject',
  userId: string,
) => {
  const target = action === 'approve' ? 'Approved' : 'Rejected'
  const moderation = () => ({
    review_status: target,
    verified_by: userId,
    verified_at: new Date().toISOString(),
  })
  // Variants that are neither rejected nor missing a status of their own.
  const aliveVariants = (column: 'release_id' | 'brand_keyboard_slug') =>
    client
      .from('keyboard_variants')
      .select('id', { count: 'exact', head: true })
      .eq(column, column === 'release_id' ? releaseId : keyboardKey)
      .or('review_status.is.null,review_status.neq.Rejected')

  const shouldResolve = async (
    row: Moderated | null | undefined,
    column: 'release_id' | 'brand_keyboard_slug',
  ) => {
    if (!row?.review_status || row.review_status === 'Approved') return false
    if (action === 'approve') return true
    if (row.review_status !== 'Pending') return false

    const { count } = await aliveVariants(column)

    return !count
  }

  const { data: release } = await client
    .from('keyboard_releases')
    .select('review_status')
    .eq('id', releaseId)
    .maybeSingle()

  if (await shouldResolve(release, 'release_id')) {
    const { error } = await client
      .from('keyboard_releases')
      .update(moderation())
      .eq('id', releaseId)

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }
  }

  const { data: keyboard } = await client
    .from('keyboards')
    .select('review_status')
    .eq('brand_keyboard_slug', keyboardKey)
    .maybeSingle()

  if (await shouldResolve(keyboard, 'brand_keyboard_slug')) {
    const { error } = await client
      .from('keyboards')
      .update(moderation())
      .eq('brand_keyboard_slug', keyboardKey)

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }
  }
}
