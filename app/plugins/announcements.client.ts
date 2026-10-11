/**
 * On sign-in, adds the announcements dismissed on this device (as a guest, or
 * through the old hard-coded toasts) to the user's dismissals, so they stay
 * hidden on every device, then loads announcements for the sidebar badge.
 * Signing out reloads them if loaded (audience and dismissals depend on the
 * user), and a tab that becomes visible again refreshes them.
 */
export default defineNuxtPlugin(() => {
  const userStore = useUserStore()
  const announcements = useAnnouncements()

  let currentUid: string | null = null

  watch(
    () => (userStore.authenticated ? userStore.user.uid : null),
    async (uid) => {
      if (uid === currentUid) return

      currentUid = uid || null

      if (uid) await announcements.mergeDismissals(uid)
      if (uid || announcements.loaded.value) announcements.load()
    },
    { immediate: true },
  )

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUid) {
      announcements.load()
    }
  })
})
