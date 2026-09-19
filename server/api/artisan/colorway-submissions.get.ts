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

  // Colorways added directly by staff have a null status (implicitly
  // approved) and never enter the moderation queue.
  let request = client
    .from('artisan_colorways')
    .select('*, maker:artisan_makers(id, name), sculpt:artisan_sculpts(name)', {
      count: 'exact',
    })
    .not('status', 'is', null)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (isModerator) {
    // Editors and Makers with specific assignments only moderate their own makers.
    if (profile && profile.role !== 'admin' && profile.assignments?.length) {
      request = request.in('maker_id', profile.assignments)
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
    data: (data || []).map(omitSensitive),
    count: count || 0,
    page,
    size,
  }
})
