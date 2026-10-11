const COOKIE_CONSENT_TOAST_ID = 'cookie-consent'

type Toaster = ReturnType<typeof useToast>

/**
 * The cookie consent toast, shown until accepted.
 *
 * Toasts added later stack on top, and the toaster measures each toast once,
 * when it mounts, to lay out the stack. Every `useToast()` call has its own
 * add queue, so toasts added through two instances can mount in the same tick
 * and get measured at the collapsed height (overlapping once the stack
 * expands on hover). Code that adds its own toasts (the layout's
 * announcements) therefore pass their instance to `show()` and call it last,
 * so the consent mounts after them, on top and tappable on phones.
 */
export const useCookieConsent = () => {
  const toast = useToast()
  const consent = useCookie('cookie-consent', { maxAge: 60 * 60 * 24 * 365 })

  const show = (queue: Toaster = toast) => {
    if (consent.value === 'accepted') return

    // A consent shown earlier (e.g. by the layout on another page) is dropped
    // at once and added again, so it lands on top of the newer toasts.
    // (toast.remove() waits for the exit animation, and add() would merge
    // into the old one in place.)
    queue.toasts.value = queue.toasts.value.filter(
      ({ id }) => id !== COOKIE_CONSENT_TOAST_ID,
    )

    queue.add({
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
  }

  return { show }
}
