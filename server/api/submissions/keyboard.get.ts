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

  // Releases/variants proposed for an already-official keyboard surface their
  // parent in the queue too, flagged as `child_submission` so review only
  // touches the proposed releases/variants.
  const childKeys = new Set<string>()

  for (const table of ['keyboard_releases', 'keyboard_variants'] as const) {
    let childRequest = client
      .from(table)
      .select('brand_keyboard_slug')
      .eq('review_status', status)

    if (!isModerator) {
      childRequest = childRequest.eq('submitted_by', user.sub)
    } else if (assignments?.length) {
      childRequest = childRequest.in('brand_slug', assignments)
    }

    const { data: childRows, error: childError } = await childRequest

    if (childError) {
      throw createError({ statusCode: 500, statusMessage: childError.message })
    }

    childRows?.forEach((row) => childKeys.add(row.brand_keyboard_slug))
  }

  // Keyboards added directly by staff have a null review_status (implicitly
  // approved) and never enter the moderation queue on their own.
  let request = client
    .from('keyboards')
    .select(
      '*, brand:keyboard_brands(name), releases:keyboard_releases(id, review_status, variants:keyboard_variants(id, review_status)), submitter:users!keyboards_submitted_by_fkey(email, full_name)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  const ownFilter = isModerator
    ? `review_status.eq.${status}`
    : `and(review_status.eq.${status},submitted_by.eq.${user.sub})`

  request = childKeys.size
    ? request.or(
        `${ownFilter},${inFilter('brand_keyboard_slug', [...childKeys])}`,
      )
    : request.not('review_status', 'is', null).eq('review_status', status)

  if (isModerator) {
    if (assignments?.length) {
      request = request.in('brand_slug', assignments)
    }
  } else if (!childKeys.size) {
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
      const releases = (row.releases || []).filter(
        (release: any) => !childSubmission || release.review_status === status,
      )
      const variants = (row.releases || []).flatMap((release: any) =>
        (release.variants || []).filter(
          (variant: any) =>
            !childSubmission || variant.review_status === status,
        ),
      )

      return {
        ...omitSensitive(row),
        child_submission: childSubmission,
        releases_count: releases.length,
        variants_count: variants.length,
        releases: undefined,
      }
    }),
    count: count || 0,
    page,
    size,
  }
})
