import { createError, defineEventHandler, getQuery } from 'h3'
import { getActorProfile } from '../../utils/admin'
import { omitSensitive } from '../../utils'
import { canManageAnyAssignment } from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const isModerator = canManageAnyAssignment(profile)

  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const size = Math.min(Math.max(Number(query.size) || 20, 1), 100)
  const status = parseReviewStatus(query.status)

  const from = (page - 1) * size
  const to = from + size - 1

  const assignments =
    isModerator && profile && profile.role !== 'admin'
      ? profile.assignments
      : null

  // Kits proposed for an already-official keyset surface their parent in the
  // queue too, flagged as `child_submission` so review only touches the kits.
  let childRequest = client
    .from('keyset_kits')
    .select('profile_keyset_id')
    .eq('review_status', status)

  if (!isModerator) {
    childRequest = childRequest.eq('submitted_by', user.sub)
  } else if (assignments?.length) {
    childRequest = childRequest.in('profile_keyset_id', assignments)
  }

  const { data: childRows, error: childError } = await childRequest

  if (childError) {
    throw createError({ statusCode: 500, statusMessage: childError.message })
  }

  const childKeys = [
    ...new Set((childRows || []).map((row) => row.profile_keyset_id)),
  ]

  // Keysets added directly by staff have a null review_status (implicitly
  // approved) and never enter the moderation queue on their own.
  let request = client
    .from('keysets')
    .select(
      '*, profile:keyset_profiles(name), kits:keyset_kits(id, review_status), submitter:users!keysets_submitted_by_fkey(email, full_name)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  const ownFilter = isModerator
    ? `review_status.eq.${status}`
    : `and(review_status.eq.${status},submitted_by.eq.${user.sub})`

  request = childKeys.length
    ? request.or(`${ownFilter},${inFilter('profile_keyset_id', childKeys)}`)
    : request.not('review_status', 'is', null).eq('review_status', status)

  if (isModerator) {
    if (assignments?.length) {
      request = request.in('profile_keyset_id', assignments)
    }
  } else if (!childKeys.length) {
    // Regular users only see the submissions they've personally sent in.
    request = request.eq('submitted_by', user.sub)
  }

  const { data, count, error } = await request

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return {
    data: (data || []).map((row: any) => {
      const childSubmission = row.review_status !== status

      return {
        ...omitSensitive(row),
        child_submission: childSubmission,
        kits_count: childSubmission
          ? row.kits?.filter((kit: any) => kit.review_status === status)
              .length || 0
          : row.kits?.length || 0,
        kits: undefined,
      }
    }),
    count: count || 0,
    page,
    size,
  }
})
