/**
 * On sign-in, adds the announcements dismissed on this device (as a guest, or
 * through the old hard-coded toasts) to the user's dismissals, so they stay
 * hidden on every device. Signing in or out reloads announcements already
 * loaded, since their audience and dismissals depend on the user.
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
      if (announcements.loaded.value) announcements.load()
    },
    { immediate: true },
  )
})
