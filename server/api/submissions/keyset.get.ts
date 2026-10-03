import { createError, defineEventHandler, getQuery } from 'h3'
import { getActorProfile } from '../../utils/admin'
import { omitSensitive } from '../../utils'
import { canManageAnyAssignment } from '~/utils/permissions'

// One row per kit, like artisan lists one row per colorway. A kit's status is
// its own review_status, falling back to its keyset's for kits that were created
// under a Pending keyset before kits carried their own status.
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

  let keysetRequest = client
    .from('keysets')
    .select('profile_keyset_id')
    .eq('review_status', status)

  if (!isModerator) {
    keysetRequest = keysetRequest.eq('submitted_by', user.sub)
  } else if (assignments?.length) {
    keysetRequest = keysetRequest.in('profile_keyset_id', assignments)
  }

  const { data: keysets, error: keysetError } = await keysetRequest

  if (keysetError) {
    throw createError({ statusCode: 500, statusMessage: keysetError.message })
  }

  const ownFilter = isModerator
    ? `review_status.eq.${status}`
    : `and(review_status.eq.${status},submitted_by.eq.${user.sub})`
  const filters = [ownFilter]

  if (keysets?.length) {
    filters.push(
      `and(review_status.is.null,${inFilter(
        'profile_keyset_id',
        keysets.map((keyset) => keyset.profile_keyset_id),
      )})`,
    )
  }

  // Kits added directly by staff have a null status under an official keyset
  // and never enter the moderation queue.
  let request = client
    .from('keyset_kits')
    .select(
      '*, category:kit_categories(name), keyset:keysets(profile_keyset_id, name, img, profile_id, review_status, profile:keyset_profiles(name), submitter:users!keysets_submitted_by_fkey(email, full_name)), submitter:users!keyset_kits_submitted_by_fkey(email, full_name)',
      { count: 'exact' },
    )
    .or(filters.join(','))
    .order('created_at', { ascending: false })
    .range(from, to)

  if (assignments?.length) {
    request = request.in('profile_keyset_id', assignments)
  }

  const { data, count, error } = await request

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    data: (data || []).map((row: any) => ({
      ...omitSensitive(row),
      status: row.review_status ?? row.keyset?.review_status,
      submitter: row.submitter ?? row.keyset?.submitter,
    })),
    count: count || 0,
    page,
    size,
  }
})
