import type { AppNotification } from '~/utils/notifications'

/**
 * Notifications of the signed-in user, shared by the sidebar link (unread
 * badge) and the `/notifications` page: the newest loaded notifications (paged by
 * `created_at`), the unread count from `unread_count()`, and optimistic
 * read/unread/delete actions that roll back on failure. The realtime subscription
 * and sign-in/sign-out lifecycle live in `plugins/notifications.client.ts`.
 */
export const useNotifications = () => {
  const toast = useToast()

  const items = useState<AppNotification[]>('notifications', () => [])
  const unread = useState('notifications-unread', () => 0)
  const hasMore = useState('notifications-has-more', () => false)
  const loaded = useState('notifications-loaded', () => false)
  const loading = useState('notifications-loading', () => false)
  const loadingOlder = useState('notifications-loading-older', () => false)

  type Page = { data: AppNotification[]; hasMore: boolean; unread: number }

  const fetchPage = (query: Record<string, string> = {}) =>
    $fetch<Page>('/api/notifications', { query })

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

  const load = async () => {
    if (loading.value) return

    loading.value = true

    try {
      const page = await fetchPage()

      merge(page.data)
      unread.value = page.unread
      if (!loaded.value) hasMore.value = page.hasMore
      loaded.value = true
    } catch (error) {
      console.error('fetch notifications error', error)
    } finally {
      loading.value = false
    }
  }

  const loadOlder = async () => {
    const oldest = items.value.at(-1)

    if (!oldest || loadingOlder.value) return

    loadingOlder.value = true

    try {
      const page = await fetchPage({ before: oldest.created_at })

      merge(page.data)
      unread.value = page.unread
      hasMore.value = page.hasMore
    } catch (error) {
      toast.add(errorToast(error))
    } finally {
      loadingOlder.value = false
    }
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

  // A notification changed elsewhere, e.g. read in another tab (realtime).
  const sync = (notification: AppNotification) => {
    const item = items.value.find(({ id }) => id === notification.id)

    if (!item) {
      refreshUnread()
      return
    }

    if (!!item.read_at === !!notification.read_at) return

    item.read_at = notification.read_at
    unread.value = Math.max(unread.value + (notification.read_at ? -1 : 1), 0)
  }

  const reset = () => {
    items.value = []
    unread.value = 0
    hasMore.value = false
    loaded.value = false
  }

  return {
    items,
    unread: readonly(unread),
    hasMore: readonly(hasMore),
    loaded: readonly(loaded),
    loading: readonly(loading),
    loadingOlder: readonly(loadingOlder),
    load,
    loadOlder,
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
