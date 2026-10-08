import { createError, defineEventHandler, getQuery } from 'h3'
import { getActorProfile } from '../../utils/admin'
import { omitSensitive } from '../../utils'
import { canManageAnyAssignment } from '~/utils/permissions'

const KIT_SELECT =
  '*, category:kit_categories(name), keyset:keysets(profile_keyset_id, name, img, profile_id, review_status, profile:keyset_profiles(name), submitter:users!keysets_submitted_by_fkey(email, full_name)), submitter:users!keyset_kits_submitted_by_fkey(email, full_name)'

// One group per keyset, each holding its kits that match the status filter, and
// paginated by keyset. A kit's status is its own review_status, falling back to
// its keyset's for kits that were created under a Pending keyset before kits
// carried their own status.
export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const isModerator = canManageAnyAssignment(profile)

  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const size = Math.min(Math.max(Number(query.size) || 20, 1), 100)
  const status = parseReviewStatus(query.status)

  const from = (page - 1) * size

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
  const kitRequest = (columns: string) => {
    let request = client
      .from('keyset_kits')
      .select(columns)
      .or(filters.join(','))
      .order('created_at', { ascending: false })

    if (assignments?.length) {
      request = request.in('profile_keyset_id', assignments)
    }

    return request
  }

  // Groups are ordered by their most recently submitted kit. The queue is small
  // enough to resolve the keyset order from the lightweight kit keys first.
  const { data: keys, error: keysError } = await kitRequest('profile_keyset_id')

  if (keysError) {
    throw createError({ statusCode: 500, statusMessage: keysError.message })
  }

  const keysetIds = [
    ...new Set(
      ((keys || []) as { profile_keyset_id: string }[]).map(
        (kit) => kit.profile_keyset_id,
      ),
    ),
  ]
  const pageIds = keysetIds.slice(from, from + size)

  if (!pageIds.length) {
    return { data: [], count: keysetIds.length, page, size }
  }

  const { data, error } = await kitRequest(KIT_SELECT).in(
    'profile_keyset_id',
    pageIds,
  )

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const groups = new Map(
    pageIds.map((id) => [
      id,
      { profile_keyset_id: id, keyset: null as any, kits: [] as any[] },
    ]),
  )

  for (const row of (data || []) as any[]) {
    const group = groups.get(row.profile_keyset_id)

    if (!group) continue

    group.keyset ??= row.keyset
    group.kits.push({
      ...omitSensitive(row),
      status: row.review_status ?? row.keyset?.review_status,
      submitter: row.submitter ?? row.keyset?.submitter,
    })
  }

  return {
    data: [...groups.values()],
    count: keysetIds.length,
    page,
    size,
  }
})
