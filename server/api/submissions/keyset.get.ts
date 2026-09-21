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
  const status = String(query.status || 'Pending').trim()

  const from = (page - 1) * size
  const to = from + size - 1

  // Keysets added directly by staff have a null review_status (implicitly
  // approved) and never enter the moderation queue.
  let request = client
    .from('keysets')
    .select(
      '*, profile:keyset_profiles(name), kits:keyset_kits(id), submitter:users!keysets_submitted_by_fkey(email, full_name)',
      { count: 'exact' },
    )
    .not('review_status', 'is', null)
    .eq('review_status', status)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (isModerator) {
    if (profile && profile.role !== 'admin' && profile.assignments?.length) {
      request = request.in('profile_keyset_id', profile.assignments)
    }
  } else {
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
    data: (data || []).map((row: any) => ({
      ...omitSensitive(row),
      kits_count: row.kits?.length || 0,
      kits: undefined,
    })),
    count: count || 0,
    page,
    size,
  }
})
