import { createError } from 'h3'
import type { H3Event } from 'h3'
import omit from 'lodash.omit'
import { getActorProfile } from './admin'
import type { ModeratorProfile } from './admin'
import {
  canManageAnyAssignment,
  canManageAssignment,
} from '~/utils/permissions'

export type ChildSubmissionDomain = 'keyset' | 'keyboard' | 'artisan'

type SupabaseClient = Awaited<ReturnType<typeof getActorProfile>>['client']

export type SubmittableTable =
  | 'keysets'
  | 'keyset_kits'
  | 'keyboards'
  | 'keyboard_releases'
  | 'keyboard_variants'
  | 'artisan_sculpts'
  | 'artisan_colorways'

/** Column/value pairs that identify the rows a helper acts on. */
export type RowMatch = Record<string, string | number>

type Moderated = { review_status: string | null; submitted_by: string | null }

export type ReviewAction = 'approve' | 'reject'

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected'

const MODERATION_FIELDS = [
  'review_status',
  'submitted_by',
  'verified_at',
  'verified_by',
]

// Children that are neither rejected nor missing a status of their own.
const ALIVE_FILTER = 'review_status.is.null,review_status.neq.Rejected'

const fail = (error: { message: string } | null) => {
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

// Supabase's typed builders can't take a table name chosen at runtime, so the
// generic helpers below go through an untyped table handle.
const from = (client: SupabaseClient, table: SubmittableTable) =>
  (client as any).from(table)

const matchRows = <Q extends { eq: (column: string, value: unknown) => Q }>(
  query: Q,
  match: RowMatch,
) =>
  Object.entries(match).reduce(
    (current, [column, value]) => current.eq(column, value),
    query,
  )

/**
 * Child payloads come from the client, so moderation fields are always dropped
 * here and re-applied server-side by `getChildSubmissionContext().attribute`.
 */
export const omitModerationFields = <T extends Record<string, unknown>>(
  record: T,
) => omit(record, MODERATION_FIELDS) as Partial<T>

/**
 * Moderation columns for a record created by `userId`: staff for the record's
 * assignment are auto-approved, everyone else submits a Pending proposal.
 */
export const getSubmissionAttribution = (isStaff: boolean, userId: string) => ({
  review_status: (isStaff ? 'Approved' : 'Pending') as ReviewStatus,
  submitted_by: userId,
  verified_at: isStaff ? new Date().toISOString() : null,
  verified_by: isStaff ? userId : null,
})

/**
 * Moderation columns written when staff approve or reject a record.
 */
export const getReviewPatch = (action: ReviewAction, userId: string) => ({
  review_status: (action === 'approve' ? 'Approved' : 'Rejected') as ReviewStatus,
  verified_by: userId,
  verified_at: new Date().toISOString(),
})

/**
 * Editing your own Rejected record sends it back to the Pending queue.
 */
export const getResubmissionPatch = () => ({
  review_status: 'Pending' as ReviewStatus,
  verified_at: null,
  verified_by: null,
})

/**
 * Returns the resubmission patch for a non-staff edit of the actor's own
 * Rejected row matching `match`, otherwise null (staff edits and other states
 * never change status).
 */
export const getOwnResubmission = async (
  client: SupabaseClient,
  table: SubmittableTable,
  match: RowMatch,
  userId: string,
  isStaff: boolean,
) => {
  if (isStaff) return null

  const { data } = await matchRows(
    from(client, table).select('review_status, submitted_by'),
    match,
  ).maybeSingle()

  return data?.submitted_by === userId && data.review_status === 'Rejected'
    ? getResubmissionPatch()
    : null
}

/**
 * Staff scope for submissions: admins (and editors without assignments) see
 * everything, others only their assigned pages. Null means unrestricted.
 */
export const getAssignmentScope = (profile: ModeratorProfile | null) =>
  profile && profile.role !== 'admin' && profile.assignments?.length
    ? profile.assignments
    : null

const PARENTS = {
  keyset: {
    table: 'keysets',
    key: 'profile_keyset_id',
    scope: 'profile_keyset_id',
    label: 'Keyset',
  },
  keyboard: {
    table: 'keyboards',
    key: 'brand_keyboard_slug',
    scope: 'brand_slug',
    label: 'Keyboard',
  },
  artisan: {
    table: 'artisan_sculpts',
    key: 'maker_sculpt_id',
    scope: 'maker_id',
    label: 'Sculpt',
  },
} as const

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
  const config = PARENTS[domain]

  const { data, error } = await from(client, config.table)
    .select(`${config.scope}, review_status, submitted_by`)
    .eq(config.key, parentKey)
    .maybeSingle()

  fail(error)

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: `${config.label} not found`,
    })
  }

  const parent = data as Moderated
  const isStaff =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, data[config.scope])
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

    return { ...base, ...getSubmissionAttribution(isStaff, user.sub) }
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

  return getReviewPatch(action, userId)
}

/**
 * Updates one child row, sending the submitter's own Rejected row back to
 * Pending. RLS filters rows silently, so no row back means the edit was
 * refused (403).
 */
export const updateChildSubmission = async ({
  client,
  table,
  match,
  payload,
  userId,
  isStaff,
  label,
}: {
  client: SupabaseClient
  table: SubmittableTable
  match: RowMatch
  payload: Record<string, unknown>
  userId: string
  isStaff: boolean
  label: string
}) => {
  const resubmission = await getOwnResubmission(
    client,
    table,
    match,
    userId,
    isStaff,
  )

  // The row is targeted by `match`; identity `id` columns can't be updated.
  const { data, error } = await matchRows(
    from(client, table).update({ ...omit(payload, 'id'), ...resubmission }),
    match,
  ).select()

  fail(error)

  if (!data?.length) {
    throw createError({
      statusCode: 403,
      statusMessage: `You can't edit this ${label} in its current state`,
    })
  }

  return { data: data[0] as Record<string, any>, resubmitted: !!resubmission }
}

/**
 * Sends a Rejected parent back to Pending after its submitter resubmitted one
 * of its children.
 */
export const resubmitRejectedParent = async (
  client: SupabaseClient,
  table: SubmittableTable,
  match: RowMatch,
) => {
  const { error } = await matchRows(
    from(client, table).update(getResubmissionPatch()),
    { ...match, review_status: 'Rejected' },
  )

  fail(error)
}

/**
 * Deletes one child row. RLS filters rows silently, so an empty result means
 * nothing was allowed (403).
 */
export const deleteChildSubmission = async ({
  client,
  table,
  match,
  label,
  select = 'id',
}: {
  client: SupabaseClient
  table: SubmittableTable
  match: RowMatch
  label: string
  select?: string
}) => {
  const { data, error } = await matchRows(
    from(client, table).delete(),
    match,
  ).select(select)

  fail(error)

  if (!data?.length) {
    throw createError({
      statusCode: 403,
      statusMessage: `You can't delete this ${label} in its current state`,
    })
  }

  return data[0] as Record<string, any>
}

/**
 * Deletes a parent under review once it has no children left, since there is
 * nothing to review anymore. Returns whether the parent was deleted.
 */
export const deleteParentIfEmpty = async (
  client: SupabaseClient,
  parent: { table: SubmittableTable; match: RowMatch },
  children: { table: SubmittableTable; match: RowMatch },
) => {
  const { count, error: countError } = await matchRows(
    from(client, children.table).select('id', { count: 'exact', head: true }),
    children.match,
  )

  fail(countError)

  if (count) return false

  const { error } = await matchRows(
    from(client, parent.table).delete(),
    parent.match,
  )

  fail(error)

  return true
}

/**
 * Gives children without a status of their own (which follow their parent) a
 * Pending status under the parent's submitter, so publishing the parent
 * doesn't publish them unreviewed.
 */
const keepStatuslessInReview = async (
  client: SupabaseClient,
  table: SubmittableTable,
  match: RowMatch,
  submittedBy: string | null,
  excludeId?: number,
) => {
  let query = matchRows(
    from(client, table).update({
      ...getResubmissionPatch(),
      submitted_by: submittedBy,
    }),
    match,
  ).is('review_status', null)

  if (excludeId !== undefined) query = query.neq('id', excludeId)

  const { error } = await query

  fail(error)
}

/**
 * Resolves a parent still under review (Pending/Rejected) after one of its
 * children was approved or rejected:
 * - approve: the parent is approved too (after `beforeApprove`);
 * - reject: only a Pending parent is rejected, and only once none of its
 *   children (`children`) is left alive, so one rejected child doesn't take
 *   down its siblings.
 */
const resolveParentReview = async ({
  client,
  table,
  match,
  children,
  action,
  userId,
  beforeApprove,
}: {
  client: SupabaseClient
  table: SubmittableTable
  match: RowMatch
  children: { table: SubmittableTable; match: RowMatch }
  action: ReviewAction
  userId: string
  beforeApprove?: (parent: Moderated) => Promise<void>
}) => {
  const { data: parent } = (await matchRows(
    from(client, table).select('review_status, submitted_by'),
    match,
  ).maybeSingle()) as { data: Moderated | null }

  if (!parent?.review_status || parent.review_status === 'Approved') return

  if (action === 'reject') {
    if (parent.review_status !== 'Pending') return

    const { count } = await matchRows(
      from(client, children.table).select('id', {
        count: 'exact',
        head: true,
      }),
      children.match,
    ).or(ALIVE_FILTER)

    if (count) return
  } else {
    await beforeApprove?.(parent)
  }

  const { error } = await matchRows(
    from(client, table).update(getReviewPatch(action, userId)),
    match,
  )

  fail(error)
}

/**
 * Approving a kit also approves its keyset when that keyset is still under
 * review, like approving a colorway resolves its sculpt; its status-less
 * sibling kits become Pending instead of being published.
 */
export const cascadeKeysetReview = (
  client: SupabaseClient,
  keysetKey: string,
  action: ReviewAction,
  userId: string,
) => {
  const match = { profile_keyset_id: keysetKey }

  return resolveParentReview({
    client,
    table: 'keysets',
    match,
    children: { table: 'keyset_kits', match },
    action,
    userId,
    beforeApprove: (keyset) =>
      keepStatuslessInReview(client, 'keyset_kits', match, keyset.submitted_by),
  })
}

/**
 * Approving a colorway also approves its sculpt when that sculpt is still
 * under review, as there's no separate moderation queue for sculpts.
 */
export const cascadeSculptReview = (
  client: SupabaseClient,
  makerId: string,
  sculptId: string,
  action: ReviewAction,
  userId: string,
) => {
  const match = { maker_id: makerId, sculpt_id: sculptId }

  return resolveParentReview({
    client,
    table: 'artisan_sculpts',
    match,
    children: { table: 'artisan_colorways', match },
    action,
    userId,
  })
}

/**
 * Approving a variant also approves its release and keyboard while those are
 * under review, like approving a colorway resolves its sculpt. Releases
 * without a status of their own follow their keyboard.
 */
export const cascadeKeyboardReview = async (
  client: SupabaseClient,
  keyboardKey: string,
  releaseId: number,
  action: ReviewAction,
  userId: string,
) => {
  const keyboardMatch = { brand_keyboard_slug: keyboardKey }

  await resolveParentReview({
    client,
    table: 'keyboard_releases',
    match: { id: releaseId },
    children: { table: 'keyboard_variants', match: { release_id: releaseId } },
    action,
    userId,
  })

  await resolveParentReview({
    client,
    table: 'keyboards',
    match: keyboardMatch,
    children: { table: 'keyboard_variants', match: keyboardMatch },
    action,
    userId,
    // Other releases and variants without a status of their own follow the
    // keyboard; the reviewed variant's own release keeps following it.
    beforeApprove: async (keyboard) => {
      await Promise.all([
        keepStatuslessInReview(
          client,
          'keyboard_releases',
          keyboardMatch,
          keyboard.submitted_by,
          releaseId,
        ),
        keepStatuslessInReview(
          client,
          'keyboard_variants',
          keyboardMatch,
          keyboard.submitted_by,
        ),
      ])
    },
  })
}
