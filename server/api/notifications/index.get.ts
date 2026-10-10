// The user's notifications, newest first. `before` (an ISO `created_at`) pages
// to older ones; `unread=1` keeps unread ones only.
export default defineEventHandler(async (event) => {
  const { client } = await getNotificationsContext(event)
  const { before, unread, limit } = getQuery(event)

  const size = Math.min(
    Math.max(Number(limit) || NOTIFICATION_PAGE_SIZE, 1),
    NOTIFICATION_PAGE_SIZE,
  )

  let query = client
    .from('notifications')
    .select(NOTIFICATION_FIELDS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(size + 1)

  if (typeof before === 'string' && before) {
    if (Number.isNaN(Date.parse(before))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid cursor' })
    }

    query = query.lt('created_at', before)
  }

  if (unread === '1' || unread === 'true') query = query.is('read_at', null)

  const [{ data, error }, unreadCount] = await Promise.all([
    query,
    getUnreadCount(client),
  ])

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const rows = data || []

  return {
    data: rows.slice(0, size),
    hasMore: rows.length > size,
    unread: unreadCount,
  }
})
