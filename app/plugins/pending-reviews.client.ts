/**
 * Loads the review counts of staff (sidebar Submissions badges) once their
 * role is known, clears them on sign-out, and refreshes them when the tab
 * becomes visible again.
 */
export default defineNuxtPlugin(() => {
  const userStore = useUserStore()
  const { load } = usePendingReviews()

  watch(() => userStore.isModerator && userStore.user.uid, load, {
    immediate: true,
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && userStore.isModerator) {
      load()
    }
  })
})
