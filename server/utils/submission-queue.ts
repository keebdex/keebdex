import { createError, getQuery } from 'h3'
import type { H3Event } from 'h3'
import { getActorProfile } from './admin'
import { getAssignmentScope, isReviewStatus } from './child-submissions'
import type { ReviewStatus } from './child-submissions'
import { omitSensitive } from './index'
import { canManageAnyAssignment } from '~/utils/permissions'

/**
 * Parents are listed through their children by filtering on a status that
 * ends up inside a PostgREST `or()` expression, so it must be whitelisted.
 */
export const parseReviewStatus = (value: unknown) => {
  const status = String(value || 'Pending').trim()

  if (!isReviewStatus(status)) {
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
 * Resolves the actor and the page/size/status query shared by the
 * `GET /api/submissions/*` review queues: moderators see the queue for their
 * assignments (`scope`, null when unrestricted), everyone else only what they
 * submitted.
 */
export const getReviewQueueContext = async (event: H3Event) => {
  const { client, user, profile } = await getActorProfile(event)
  const isModerator = canManageAnyAssignment(profile)

  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const size = Math.min(Math.max(Number(query.size) || 20, 1), 100)

  return {
    client,
    user,
    isModerator,
    scope: isModerator ? getAssignmentScope(profile) : null,
    status: parseReviewStatus(query.status),
    page,
    size,
    from: (page - 1) * size,
  }
}

type GroupedQueue = {
  parentTable: 'keysets' | 'keyboards'
  childTable: 'keyset_kits' | 'keyboard_variants'
  groupKey: 'profile_keyset_id' | 'brand_keyboard_slug'
  // Assignment column, present on both the parent and child tables.
  scopeColumn: 'profile_keyset_id' | 'brand_slug'
}

export const KEYSET_QUEUE: GroupedQueue = {
  parentTable: 'keysets',
  childTable: 'keyset_kits',
  groupKey: 'profile_keyset_id',
  scopeColumn: 'profile_keyset_id',
}

export const KEYBOARD_QUEUE: GroupedQueue = {
  parentTable: 'keyboards',
  childTable: 'keyboard_variants',
  groupKey: 'brand_keyboard_slug',
  scopeColumn: 'brand_slug',
}

/**
 * The children of a grouped queue with `status`: those with that status of
 * their own, plus status-less children of a parent with that status. Returns
 * a request builder for the child table, narrowed to the actor's scope (or to
 * their own submissions for non-staff).
 */
const groupedChildRequest = async (
  client: any,
  { parentTable, childTable, groupKey, scopeColumn }: GroupedQueue,
  {
    isModerator,
    userId,
    scope,
    status,
  }: {
    isModerator: boolean
    userId: string
    scope: string[] | null
    status: ReviewStatus
  },
) => {
  let parentRequest = client
    .from(parentTable)
    .select(groupKey)
    .eq('review_status', status)

  if (!isModerator) {
    parentRequest = parentRequest.eq('submitted_by', userId)
  } else if (scope) {
    parentRequest = parentRequest.in(scopeColumn, scope)
  }

  const { data: parents, error: parentError } = await parentRequest

  if (parentError) {
    throw createError({ statusCode: 500, statusMessage: parentError.message })
  }

  const filters = [
    isModerator
      ? `review_status.eq.${status}`
      : `and(review_status.eq.${status},submitted_by.eq.${userId})`,
  ]

  if (parents?.length) {
    filters.push(
      `and(review_status.is.null,${inFilter(
        groupKey,
        parents.map((parent: Record<string, string>) => parent[groupKey]),
      )})`,
    )
  }

  return (columns: string, options?: { count: 'exact'; head: true }) => {
    const request = client
      .from(childTable)
      .select(columns, options)
      .or(filters.join(','))

    return scope ? request.in(scopeColumn, scope) : request
  }
}

/**
 * Lists a review queue grouped by parent (keyset > kits, keyboard >
 * variants), paginated by group and ordered by each group's most recently
 * submitted child. A child's status is its own review_status, falling back to
 * its parent's for children created under a Pending parent before they carried
 * their own status. Children added directly by staff have a null status under
 * an official parent and never enter the queue.
 */
export const listGroupedSubmissions = async (
  event: H3Event,
  {
    queue,
    select,
    parentName,
    childrenName,
    parentOf,
  }: {
    queue: GroupedQueue
    select: string
    parentName: string
    childrenName: string
    parentOf: (row: any) => any
  },
) => {
  const { client, user, isModerator, scope, status, page, size, from } =
    await getReviewQueueContext(event)
  const { groupKey } = queue

  const children = await groupedChildRequest(client, queue, {
    isModerator,
    userId: user.sub,
    scope,
    status,
  })

  const childRequest = (columns: string) =>
    children(columns).order('created_at', { ascending: false })

  // The queue is small enough to resolve the group order from the
  // lightweight child keys first.
  const { data: keys, error: keysError } = await childRequest(groupKey)

  if (keysError) {
    throw createError({ statusCode: 500, statusMessage: keysError.message })
  }

  const groupIds: string[] = [
    ...new Set<string>(
      (keys || []).map((row: Record<string, string>) => row[groupKey]),
    ),
  ]
  const pageIds = groupIds.slice(from, from + size)

  if (!pageIds.length) {
    return { data: [], count: groupIds.length, page, size }
  }

  const { data, error } = await childRequest(select).in(groupKey, pageIds)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const groups = new Map(
    pageIds.map((id) => [
      id,
      { [groupKey]: id, [parentName]: null, [childrenName]: [] } as Record<
        string,
        any
      >,
    ]),
  )

  for (const row of data || []) {
    const group = groups.get(row[groupKey])

    if (!group) continue

    const parent = parentOf(row)

    group[parentName] ??= parent
    group[childrenName].push({
      ...omitSensitive(row),
      status: row.review_status ?? parent?.review_status,
      submitter: row.submitter ?? parent?.submitter,
    })
  }

  return {
    data: [...groups.values()],
    count: groupIds.length,
    page,
    size,
  }
}

/**
 * Number of children of a grouped queue waiting for review in the staff
 * member's scope (`null` for unrestricted), counted like the Pending filter
 * of `listGroupedSubmissions` lists them.
 */
export const countGroupedPending = async (
  client: any,
  queue: GroupedQueue,
  { userId, scope }: { userId: string; scope: string[] | null },
) => {
  const children = await groupedChildRequest(client, queue, {
    isModerator: true,
    userId,
    scope,
    status: 'Pending',
  })

  const { count, error } = await children('id', { count: 'exact', head: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return count || 0
}
