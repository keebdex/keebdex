const COOKIE_CONSENT_TOAST_ID = 'cookie-consent'

// Stops the watcher that keeps the consent on top (one per page load).
let stopKeepingOnTop: (() => void) | null = null

/**
 * The cookie consent toast, shown until accepted, and always on top of the
 * toast stack so it stays in front and tappable on phones. Toasts added later
 * stack above earlier ones, and every `useToast()` call queues its own adds,
 * so the order of `add()` calls across composables is not reliable; instead
 * the consent is moved back to the top whenever another toast lands above it.
 * Pages that add their own toasts (the homepage announcements) still call
 * `show()` after them, so it does not flash below them first.
 */
export const useCookieConsent = () => {
  const toast = useToast()
  const consent = useCookie('cookie-consent', { maxAge: 60 * 60 * 24 * 365 })

  const keepOnTop = () => {
    stopKeepingOnTop?.()

    // add() is queued, so the consent may land after other toasts.
    let landed = false

    stopKeepingOnTop = watch(
      () => toast.toasts.value.map(({ id }) => id),
      (ids) => {
        const index = ids.indexOf(COOKIE_CONSENT_TOAST_ID)

        if (index === -1) {
          // Accepted (or otherwise removed): nothing left to keep on top.
          if (landed) {
            stopKeepingOnTop?.()
            stopKeepingOnTop = null
          }
          return
        }

        landed = true

        if (index === ids.length - 1) return

        const consentToast = toast.toasts.value[index]!

        toast.toasts.value = [
          ...toast.toasts.value.filter(
            ({ id }) => id !== COOKIE_CONSENT_TOAST_ID,
          ),
          consentToast,
        ]
      },
      { flush: 'sync' },
    )
  }

  const show = () => {
    if (consent.value === 'accepted') return

    // Already showing, and already kept on top.
    if (toast.toasts.value.some(({ id }) => id === COOKIE_CONSENT_TOAST_ID)) {
      return
    }

    toast.add({
      id: COOKIE_CONSENT_TOAST_ID,
      title: 'We Use Cookies',
      description:
        'To improve your experience. By using our site, you agree to our use of cookies.',
      icon: 'hugeicons:cookie',
      duration: 0,
      close: false,
      actions: [
        {
          label: 'Accept',
          color: 'info',
          onClick: () => {
            consent.value = 'accepted'
          },
        },
      ],
    })

    keepOnTop()
  }

  return { show }
}
