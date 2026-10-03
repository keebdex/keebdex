import { createError, defineEventHandler, getQuery } from 'h3'
import { getActorProfile } from '../../utils/admin'
import { omitSensitive } from '../../utils'
import { canManageAnyAssignment } from '~/utils/permissions'

// One row per variant (keyboard > release > variant), like artisan lists one
// row per colorway. A variant's status is its own review_status, falling back
// to its keyboard's for variants that were created under a Pending keyboard
// before variants carried their own status.
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

  let keyboardRequest = client
    .from('keyboards')
    .select('brand_keyboard_slug')
    .eq('review_status', status)

  if (!isModerator) {
    keyboardRequest = keyboardRequest.eq('submitted_by', user.sub)
  } else if (assignments?.length) {
    keyboardRequest = keyboardRequest.in('brand_slug', assignments)
  }

  const { data: keyboards, error: keyboardError } = await keyboardRequest

  if (keyboardError) {
    throw createError({ statusCode: 500, statusMessage: keyboardError.message })
  }

  const ownFilter = isModerator
    ? `review_status.eq.${status}`
    : `and(review_status.eq.${status},submitted_by.eq.${user.sub})`
  const filters = [ownFilter]

  if (keyboards?.length) {
    filters.push(
      `and(review_status.is.null,${inFilter(
        'brand_keyboard_slug',
        keyboards.map((keyboard) => keyboard.brand_keyboard_slug),
      )})`,
    )
  }

  // Variants added directly by staff have a null status under an official
  // keyboard and never enter the moderation queue.
  let request = client
    .from('keyboard_variants')
    .select(
      '*, release:keyboard_releases(id, name, review_status, submitted_by, keyboard:keyboards(brand_keyboard_slug, name, brand_slug, review_status, brand:keyboard_brands(name), submitter:users!keyboards_submitted_by_fkey(email, full_name))), submitter:users!keyboard_variants_submitted_by_fkey(email, full_name)',
      { count: 'exact' },
    )
    .or(filters.join(','))
    .order('created_at', { ascending: false })
    .range(from, to)

  if (assignments?.length) {
    request = request.in('brand_slug', assignments)
  }

  const { data, count, error } = await request

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    data: (data || []).map((row: any) => ({
      ...omitSensitive(row),
      status: row.review_status ?? row.release?.keyboard?.review_status,
      submitter: row.submitter ?? row.release?.keyboard?.submitter,
    })),
    count: count || 0,
    page,
    size,
  }
})
