import type { AppNotification } from '~/utils/notifications'

export type NotificationFilter = 'all' | 'unread'

interface NotificationCursor {
  // created_at of the oldest notification this filter has loaded
  oldest: string | null
  hasMore: boolean
  loaded: boolean
  loading: boolean
}

const emptyCursor = (): NotificationCursor => ({
  oldest: null,
  hasMore: false,
  loaded: false,
  loading: false,
})

/**
 * Notifications of the signed-in user, shared by the sidebar link (unread
 * badge) and the `/notifications` page: the loaded notifications, the unread
 * count from `unread_count()`, and optimistic read/unread/delete actions that
 * roll back on failure. All and Unread page separately from the server
 * (`unread=1`, each with its own `created_at` cursor) into one list, and
 * `visibleFor(filter)` keeps each filter to the range it has loaded. The
 * realtime subscription and sign-in/sign-out lifecycle live in
 * `plugins/notifications.client.ts`.
 */
export const useNotifications = () => {
  const toast = useToast()

  const items = useState<AppNotification[]>('notifications', () => [])
  const unread = useState('notifications-unread', () => 0)
  const cursors = useState<Record<NotificationFilter, NotificationCursor>>(
    'notifications-cursors',
    () => ({ all: emptyCursor(), unread: emptyCursor() }),
  )
  const loadingOlder = useState('notifications-loading-older', () => false)

  type Page = { data: AppNotification[]; hasMore: boolean; unread: number }

  const fetchPage = (
    filter: NotificationFilter,
    query: Record<string, string> = {},
  ) =>
    $fetch<Page>('/api/notifications', {
      query: filter === 'unread' ? { ...query, unread: '1' } : query,
    })

  // Adds notifications not loaded yet and refreshes the loaded ones, newest
  // first.
  const merge = (incoming: AppNotification[]) => {
    const byId = new Map(items.value.map((item) => [item.id, item]))

    for (const item of incoming) byId.set(item.id, item)

    items.value = [...byId.values()].sort(
      (a, b) =>
        b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
    )
  }

  // First page of a filter; later calls refresh the newest notifications
  // without moving a cursor that has already paged further.
  const load = async (filter: NotificationFilter = 'all') => {
    const cursor = cursors.value[filter]

    if (cursor.loading) return

    cursor.loading = true

    try {
      const page = await fetchPage(filter)

      merge(page.data)
      unread.value = page.unread

      if (!cursor.loaded) {
        cursor.hasMore = page.hasMore
        cursor.oldest = page.data.at(-1)?.created_at ?? null
      }

      cursor.loaded = true
    } catch (error) {
      console.error('fetch notifications error', error)
    } finally {
      cursor.loading = false
    }
  }

  const loadOlder = async (filter: NotificationFilter = 'all') => {
    const cursor = cursors.value[filter]

    if (!cursor.oldest || loadingOlder.value) return

    loadingOlder.value = true

    try {
      const page = await fetchPage(filter, { before: cursor.oldest })

      merge(page.data)
      unread.value = page.unread
      cursor.hasMore = page.hasMore
      cursor.oldest = page.data.at(-1)?.created_at ?? cursor.oldest
    } catch (error) {
      toast.add(errorToast(error))
    } finally {
      loadingOlder.value = false
    }
  }

  /**
   * Notifications a filter shows: unread ones for Unread, and only down to
   * the oldest one that filter has paged to, so older ones loaded by the
   * other filter don't appear before the ones in between.
   */
  const visibleFor = (filter: NotificationFilter) => {
    const { oldest, hasMore } = cursors.value[filter]

    return items.value.filter(
      (item) =>
        (filter === 'all' || !item.read_at) &&
        (!hasMore || !oldest || item.created_at >= oldest),
    )
  }

  const refreshUnread = async () => {
    try {
      const result = await $fetch<{ unread: number }>(
        '/api/notifications/unread-count',
      )

      unread.value = result.unread
    } catch (error) {
      console.error('fetch unread notifications error', error)
    }
  }

  const setRead = async (notification: AppNotification, read: boolean) => {
    const item = items.value.find(({ id }) => id === notification.id)

    if (!item || !!item.read_at === read) return

    const previous = item.read_at

    item.read_at = read ? new Date().toISOString() : null
    unread.value = Math.max(unread.value + (read ? -1 : 1), 0)

    try {
      const result = await $fetch<{ data: AppNotification; unread: number }>(
        `/api/notifications/${item.id}`,
        { method: 'patch', body: { read } },
      )

      item.read_at = result.data.read_at
      unread.value = result.unread
    } catch (error) {
      item.read_at = previous
      unread.value = Math.max(unread.value + (read ? 1 : -1), 0)
      toast.add(errorToast(error))
    }
  }

  const markRead = (notification: AppNotification) =>
    setRead(notification, true)

  const markUnread = (notification: AppNotification) =>
    setRead(notification, false)

  const markAllRead = async () => {
    const changed = items.value.filter((item) => !item.read_at)
    const previousUnread = unread.value

    if (!previousUnread && !changed.length) return

    const now = new Date().toISOString()

    for (const item of changed) item.read_at = now
    unread.value = 0

    try {
      await $fetch('/api/notifications/read-all', { method: 'post' })
    } catch (error) {
      for (const item of changed) item.read_at = null
      unread.value = previousUnread
      toast.add(errorToast(error))
    }
  }

  const remove = async (notification: AppNotification) => {
    const index = items.value.findIndex(({ id }) => id === notification.id)

    if (index === -1) return

    const [item] = items.value.splice(index, 1)

    if (!item!.read_at) unread.value = Math.max(unread.value - 1, 0)

    try {
      const result = await $fetch<{ unread: number }>(
        `/api/notifications/${item!.id}`,
        { method: 'delete' },
      )

      unread.value = result.unread
    } catch (error) {
      merge([item!])
      if (!item!.read_at) unread.value += 1
      toast.add(errorToast(error))
    }
  }

  // A notification inserted for this user (realtime).
  const receive = (notification: AppNotification) => {
    if (items.value.some(({ id }) => id === notification.id)) return

    merge([notification])
    if (!notification.read_at) unread.value += 1

    const view = renderNotification(notification)

    toast.add(
      notificationToast({ ...view, onView: () => markRead(notification) }),
    )
  }

  // A notification changed elsewhere (realtime): read in another tab, or a
  // grouped notification that merged another event (new data.count, moved to
  // the top). Toasts are only for inserts.
  const sync = (notification: AppNotification) => {
    const item = items.value.find(({ id }) => id === notification.id)

    if (!item) {
      merge([notification])
      refreshUnread()
      return
    }

    if (!!item.read_at !== !!notification.read_at) {
      unread.value = Math.max(unread.value + (notification.read_at ? -1 : 1), 0)
    }

    merge([notification])
  }

  const reset = () => {
    items.value = []
    unread.value = 0
    cursors.value = { all: emptyCursor(), unread: emptyCursor() }
  }

  return {
    items,
    unread: readonly(unread),
    cursors: readonly(cursors),
    loadingOlder: readonly(loadingOlder),
    load,
    loadOlder,
    visibleFor,
    refreshUnread,
    markRead,
    markUnread,
    markAllRead,
    remove,
    receive,
    sync,
    reset,
  }
}
