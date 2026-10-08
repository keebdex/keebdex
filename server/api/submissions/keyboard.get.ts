import { createError, defineEventHandler, getQuery } from 'h3'
import { getActorProfile } from '../../utils/admin'
import { omitSensitive } from '../../utils'
import { canManageAnyAssignment } from '~/utils/permissions'

const VARIANT_SELECT =
  '*, release:keyboard_releases(id, name, review_status, submitted_by, keyboard:keyboards(brand_keyboard_slug, name, brand_slug, form_factor, review_status, brand:keyboard_brands(name), submitter:users!keyboards_submitted_by_fkey(email, full_name))), submitter:users!keyboard_variants_submitted_by_fkey(email, full_name)'

// One group per keyboard, each holding its variants (keyboard > release >
// variant) that match the status filter, and paginated by keyboard. A
// variant's status is its own review_status, falling back to its keyboard's
// for variants that were created under a Pending keyboard before variants
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
  const variantRequest = (columns: string) => {
    let request = client
      .from('keyboard_variants')
      .select(columns)
      .or(filters.join(','))
      .order('created_at', { ascending: false })

    if (assignments?.length) {
      request = request.in('brand_slug', assignments)
    }

    return request
  }

  // Groups are ordered by their most recently submitted variant. The queue is
  // small enough to resolve the keyboard order from the variant keys first.
  const { data: keys, error: keysError } = await variantRequest(
    'brand_keyboard_slug',
  )

  if (keysError) {
    throw createError({ statusCode: 500, statusMessage: keysError.message })
  }

  const keyboardSlugs = [
    ...new Set(
      ((keys || []) as { brand_keyboard_slug: string }[]).map(
        (variant) => variant.brand_keyboard_slug,
      ),
    ),
  ]
  const pageSlugs = keyboardSlugs.slice(from, from + size)

  if (!pageSlugs.length) {
    return { data: [], count: keyboardSlugs.length, page, size }
  }

  const { data, error } = await variantRequest(VARIANT_SELECT).in(
    'brand_keyboard_slug',
    pageSlugs,
  )

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const groups = new Map(
    pageSlugs.map((slug) => [
      slug,
      {
        brand_keyboard_slug: slug,
        keyboard: null as any,
        variants: [] as any[],
      },
    ]),
  )

  for (const row of (data || []) as any[]) {
    const group = groups.get(row.brand_keyboard_slug)

    if (!group) continue

    group.keyboard ??= row.release?.keyboard
    group.variants.push({
      ...omitSensitive(row),
      status: row.review_status ?? row.release?.keyboard?.review_status,
      submitter: row.submitter ?? row.release?.keyboard?.submitter,
    })
  }

  return {
    data: [...groups.values()],
    count: keyboardSlugs.length,
    page,
    size,
  }
})
