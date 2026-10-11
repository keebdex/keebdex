import type { Announcement } from '~/utils/announcements'

type AnnouncementsPayload = {
  data: Announcement[]
  signedIn: boolean
  userId: string | null
  dismissed: string[]
  toasts: boolean
}

// Keys dismissed on this device: by guests, and by signed-in users so the
// device keeps them hidden after signing out.
const LOCAL_KEY = 'dismissed-announcements'
// Keys of this device already merged into a user's dismissals, per user id.
// From then on the server decides for that user.
const MERGED_PREFIX = 'announcement-dismissals-merged:'
// The old hard-coded toasts stored this value under their key.
const LEGACY_VALUE = 'acknowledged'

// The latest GET /api/announcements in flight (client-only, like the rest).
let latestLoad: Promise<AnnouncementsPayload | null> | null = null

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
 * Live announcements for the current visitor (`GET /api/announcements`).
 * Shared by the announcement toasts (shown by the layout), the Announcements tab of /notifications, and
 * the sidebar badge; `plugins/announcements.client.ts` loads them for
 * signed-in users and merges this device's dismissals on sign-in.
 *
 * Dismissed (or read, which is the same thing) means:
 * - guests: this device's list plus the old toasts' acknowledged keys;
 * - signed in: `announcement_dismissals`, plus this device's keys not merged
 *   into it yet. Merged keys no longer count locally, so the database decides
 *   (and clearing it shows the announcements again).
 *
 * Unread (signed in): not dismissed yet; Mark as read dismisses. Client-only:
 * dismissals live in localStorage.
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
  const mergedKeys = useState<string[]>('announcements-merged', () => [])
  const loading = useState('announcements-loading', () => false)

  const syncLocal = (uid?: string | null) => {
    localDismissed.value = [
      ...new Set([...readJson(LOCAL_KEY), ...legacyDismissals()]),
    ]
    mergedKeys.value = uid ? readJson(`${MERGED_PREFIX}${uid}`) : []
  }

  const items = computed(() => sortAnnouncements(payload.value?.data || []))
  const signedIn = computed(() => !!payload.value?.signedIn)

  const dismissed = computed(() => {
    if (!payload.value?.signedIn) return new Set(localDismissed.value)

    return new Set([
      ...payload.value.dismissed,
      ...localDismissed.value.filter((key) => !mergedKeys.value.includes(key)),
    ])
  })

  const isDismissed = (key: string) => dismissed.value.has(key)

  // Toasts on page load: off when the user turned them off in settings.
  const toastItems = computed(() =>
    payload.value?.toasts === false
      ? []
      : items.value.filter((item) => item.show_toast && !isDismissed(item.key)),
  )

  const isUnread = (item: Announcement) =>
    signedIn.value && !isDismissed(item.key)

  const unread = computed(() => items.value.filter(isUnread).length)

  const fetchPayload = async () => {
    try {
      const result = await $fetch<AnnouncementsPayload>('/api/announcements')

      return result
    } catch (error) {
      console.error('fetch announcements error', error)
      return null
    }
  }

  /**
   * Loads the announcements. The latest call wins, so a load started before
   * a merge or a sign-in can't overwrite a newer one, and every caller
   * resolves once the latest load has landed.
   */
  const load = async () => {
    let run = fetchPayload()

    latestLoad = run
    loading.value = true

    let result = await run

    while (latestLoad !== run) {
      run = latestLoad!
      result = await run
    }

    if (result) {
      syncLocal(result.userId)
      payload.value = result
    }

    loading.value = false
  }

  // Keeps the keys on this device too (hidden after signing out), marked as
  // merged for a signed-in user so the server stays the source of truth.
  const rememberLocally = (keys: string[], uid?: string | null) => {
    localDismissed.value = [...new Set([...localDismissed.value, ...keys])]
    writeJson(LOCAL_KEY, [...new Set([...readJson(LOCAL_KEY), ...keys])])

    if (uid) {
      mergedKeys.value = [...new Set([...mergedKeys.value, ...keys])]
      writeJson(`${MERGED_PREFIX}${uid}`, mergedKeys.value)
    }
  }

  /** Dismisses (marks as read) announcements: on the server when signed in. */
  const dismissMany = async (keys: string[]) => {
    if (!keys.length) return

    if (!payload.value?.signedIn) {
      rememberLocally(keys)
      return
    }

    const state = payload.value
    const previous = state.dismissed

    state.dismissed = [...new Set([...previous, ...keys])]

    try {
      if (keys.length === 1) {
        await $fetch(
          `/api/announcements/${encodeURIComponent(keys[0]!)}/dismiss`,
          { method: 'post' },
        )
      } else {
        await $fetch('/api/announcements/merge-dismissals', {
          method: 'post',
          body: { keys },
        })
      }

      rememberLocally(keys, state.userId)
    } catch (error) {
      state.dismissed = previous
      // Hidden on this device anyway; merged on the next sign-in.
      rememberLocally(keys)
      console.error('dismiss announcements error', keys, error)
    }
  }

  const dismiss = (key: string) => dismissMany([key])

  // Mark all as read: every unread one is dismissed (no more toasts either).
  const markAllRead = () =>
    dismissMany(items.value.filter(isUnread).map((item) => item.key))

  // Adds this device's dismissals (and the old toasts' acknowledged keys) to
  // the user's dismissals, once per key and user.
  const mergeDismissals = async (uid: string) => {
    syncLocal(uid)

    const keys = localDismissed.value.filter(
      (key) => !mergedKeys.value.includes(key),
    )

    if (!keys.length) return

    try {
      await $fetch('/api/announcements/merge-dismissals', {
        method: 'post',
        body: { keys },
      })

      mergedKeys.value = [...mergedKeys.value, ...keys]
      writeJson(`${MERGED_PREFIX}${uid}`, mergedKeys.value)
    } catch (error) {
      console.error('merge announcement dismissals error', error)
    }
  }

  /**
   * Shows the announcement toasts through `queue` and returns their ids. Toasts
   * added later stack on top, so the "+N more updates" summary goes first and
   * the highest priority last. Pass the queue the cookie consent is added
   * through afterwards (see `useCookieConsent`), so the toasts mount one at a
   * time and the consent lands on top.
   */
  const showToasts = (queue = toast) => {
    const shown = toastItems.value.slice(0, ANNOUNCEMENT_TOAST_LIMIT)
    const rest = toastItems.value.length - shown.length
    const ids = shown.map((item) => item.key)

    if (rest > 0) {
      queue.add(
        announcementSummaryToast(
          rest,
          signedIn.value ? '/notifications?filter=announcements' : '/changelog',
        ),
      )
      ids.push(ANNOUNCEMENT_SUMMARY_TOAST_ID)
    }

    for (const item of [...shown].reverse()) {
      queue.add(announcementToast(item, () => dismiss(item.key)))
    }

    tightenStack(queue, ids)

    return ids
  }

  /**
   * Keeps the expanded spacing between the announcement toasts at half the
   * toaster's gap (see `ANNOUNCEMENT_STACK_CLASSES`), recomputed as toasts
   * land and as they are dismissed. Stops once none of them is left.
   */
  const tightenStack = (queue: typeof toast, ids: string[]) => {
    const keys = ids.filter((id) => id !== ANNOUNCEMENT_SUMMARY_TOAST_ID)
    let landed = false

    const stop = watch(
      () => queue.toasts.value.map(({ id }) => String(id)),
      (current) => {
        // Front first: the toaster draws the last toast in front.
        const front = current.filter((id) => keys.includes(id)).reverse()
        const present = current.filter((id) => ids.includes(id))

        if (!present.length) {
          if (landed) stop()
          return
        }

        landed = true

        const shift = (id: string | number) =>
          id === ANNOUNCEMENT_SUMMARY_TOAST_ID
            ? Math.max(front.length - 1, 0)
            : front.indexOf(id as string)

        queue.toasts.value.forEach((item, index) => {
          if (!ids.includes(String(item.id))) return

          const className = ANNOUNCEMENT_STACK_CLASSES[shift(item.id)] || ''

          if ((item.class || '') !== className) {
            queue.toasts.value[index] = { ...item, class: className }
          }
        })
      },
      { immediate: true },
    )
  }

  return {
    items,
    signedIn,
    loading: readonly(loading),
    loaded: computed(() => !!payload.value),
    toastItems,
    unread,
    isUnread,
    load,
    dismiss,
    markAllRead,
    mergeDismissals,
    showToasts,
  }
}
