import type { Announcement } from '~/utils/announcements'

type AnnouncementsPayload = {
  data: Announcement[]
  signedIn: boolean
  dismissed: string[]
  seenAt: string | null
  toasts: boolean
}

// Keys dismissed on this device: by guests, and by signed-in users so the
// device keeps them hidden after signing out.
const LOCAL_KEY = 'dismissed-announcements'
// Keys already merged into a user's dismissals, per user id.
const MERGED_PREFIX = 'announcement-dismissals-merged:'
// The old hard-coded toasts stored this value under their key.
const LEGACY_VALUE = 'acknowledged'

const readJson = (key: string): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')

    return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

const writeJson = (key: string, value: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be full or blocked; the server copy still applies.
  }
}

const readCookies = () =>
  Object.fromEntries(
    document.cookie
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([name]) => name)
      .map(([name, ...value]) => [
        decodeURIComponent(name!),
        decodeURIComponent(value.join('=')),
      ]),
  )

// Keys the old toasts marked acknowledged, in localStorage or (Themes) a
// cookie. Unknown keys are harmless: they match no announcement.
const legacyDismissals = () => {
  const keys: string[] = []

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && localStorage.getItem(key) === LEGACY_VALUE) keys.push(key)
    }
  } catch {
    // Blocked storage: nothing to migrate.
  }

  for (const [name, value] of Object.entries(readCookies())) {
    if (value === LEGACY_VALUE) keys.push(name)
  }

  return keys
}

/**
 * Live announcements for the current visitor (`GET /api/announcements`), with
 * dismissals from the server (signed in), this device, and the old toasts.
 * Shared by the homepage toasts and the Announcements tab of /notifications;
 * `plugins/announcements.client.ts` merges this device's dismissals on
 * sign-in. Client-only: dismissals live in localStorage.
 */
export const useAnnouncements = () => {
  const toast = useToast()

  const payload = useState<AnnouncementsPayload | null>(
    'announcements',
    () => null,
  )
  const localDismissed = useState<string[]>(
    'announcements-local-dismissed',
    () => [],
  )
  const loading = useState('announcements-loading', () => false)

  const syncLocal = () => {
    localDismissed.value = [
      ...new Set([...readJson(LOCAL_KEY), ...legacyDismissals()]),
    ]
  }

  const items = computed(() => sortAnnouncements(payload.value?.data || []))
  const signedIn = computed(() => !!payload.value?.signedIn)
  const seenAt = computed(() => payload.value?.seenAt ?? null)

  const dismissed = computed(
    () => new Set([...(payload.value?.dismissed || []), ...localDismissed.value]),
  )

  const isDismissed = (key: string) => dismissed.value.has(key)

  // Toasts for the homepage: off when the user turned them off in settings.
  const toastItems = computed(() =>
    payload.value?.toasts === false
      ? []
      : items.value.filter((item) => item.show_toast && !isDismissed(item.key)),
  )

  // Published since the tab was last opened and not dismissed.
  const isNew = (item: Announcement, since = seenAt.value) =>
    !since || item.starts_at > since

  const unseen = computed(() =>
    signedIn.value
      ? items.value.filter((item) => isNew(item) && !isDismissed(item.key))
          .length
      : 0,
  )

  const load = async () => {
    if (loading.value) return

    loading.value = true
    syncLocal()

    try {
      payload.value = await $fetch<AnnouncementsPayload>('/api/announcements')
    } catch (error) {
      console.error('fetch announcements error', error)
    } finally {
      loading.value = false
    }
  }

  const dismiss = async (key: string) => {
    if (!localDismissed.value.includes(key)) {
      localDismissed.value = [...localDismissed.value, key]
      writeJson(LOCAL_KEY, [...new Set([...readJson(LOCAL_KEY), key])])
    }

    if (!signedIn.value) return

    payload.value!.dismissed = [...payload.value!.dismissed, key]

    try {
      await $fetch(`/api/announcements/${encodeURIComponent(key)}/dismiss`, {
        method: 'post',
      })
    } catch (error) {
      // Still hidden on this device; it syncs with the next merge.
      console.error('dismiss announcement error', key, error)
    }
  }

  // Opening the Announcements tab: everything shown so far is no longer new.
  const markSeen = async () => {
    if (!payload.value?.signedIn) return

    const previous = payload.value.seenAt

    payload.value.seenAt = new Date().toISOString()

    try {
      const result = await $fetch<{ seenAt: string }>(
        '/api/announcements/seen',
        { method: 'post' },
      )

      if (payload.value) payload.value.seenAt = result.seenAt
    } catch (error) {
      if (payload.value) payload.value.seenAt = previous
      console.error('mark announcements seen error', error)
    }
  }

  // Adds this device's dismissals (and the old toasts' acknowledged keys) to
  // the user's dismissals, once per key and user.
  const mergeDismissals = async (uid: string) => {
    syncLocal()

    const merged = readJson(`${MERGED_PREFIX}${uid}`)
    const keys = localDismissed.value.filter((key) => !merged.includes(key))

    if (!keys.length) return

    try {
      await $fetch('/api/announcements/merge-dismissals', {
        method: 'post',
        body: { keys },
      })

      writeJson(`${MERGED_PREFIX}${uid}`, [...merged, ...keys])
    } catch (error) {
      console.error('merge announcement dismissals error', error)
    }
  }

  /**
   * Shows the homepage toasts and returns their ids. Toasts added later stack
   * on top, so the "+N more updates" summary goes first and the highest
   * priority last; the cookie consent is added after these, on top of all.
   */
  const showToasts = () => {
    const shown = toastItems.value.slice(0, ANNOUNCEMENT_TOAST_LIMIT)
    const rest = toastItems.value.length - shown.length
    const ids = shown.map((item) => item.key)

    if (rest > 0) {
      toast.add(
        announcementSummaryToast(
          rest,
          signedIn.value ? '/notifications?filter=announcements' : '/changelog',
        ),
      )
      ids.push(ANNOUNCEMENT_SUMMARY_TOAST_ID)
    }

    for (const item of [...shown].reverse()) {
      toast.add(announcementToast(item, () => dismiss(item.key)))
    }

    return ids
  }

  const hideToasts = (ids: string[]) => {
    for (const id of ids) toast.remove(id)
  }

  return {
    items,
    signedIn,
    seenAt,
    loading: readonly(loading),
    loaded: computed(() => !!payload.value),
    toastItems,
    unseen,
    isDismissed,
    isNew,
    load,
    dismiss,
    markSeen,
    mergeDismissals,
    showToasts,
    hideToasts,
  }
}
