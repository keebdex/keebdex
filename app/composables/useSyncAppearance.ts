import type { Appearance } from '~/types/appearance'

const COLOR_MODES = ['system', 'light', 'dark'] as const

function isColorMode(
  value: unknown,
): value is NonNullable<Appearance['colorMode']> {
  return COLOR_MODES.includes(value as (typeof COLOR_MODES)[number])
}

export function useSyncAppearance() {
  const userStore = useUserStore()
  const { themeId, setTheme } = useAppTheme()
  const colorMode = useColorMode()
  let applyingFromServer = false

  function applyServerAppearance(appearance: Appearance) {
    const theme = appearance.theme
    const serverColorMode = appearance.colorMode
    const hasTheme = typeof theme === 'string'
    const hasColorMode = isColorMode(serverColorMode)

    applyingFromServer = true
    if (hasTheme) setTheme(theme)
    if (hasColorMode) colorMode.preference = serverColorMode
    applyingFromServer = false

    const resolvedTheme = themeId.value
    const resolvedColorMode = colorMode.preference
    if (
      !hasTheme ||
      theme !== resolvedTheme ||
      !hasColorMode
    ) {
      userStore.saveAppearance({
        theme: resolvedTheme,
        colorMode: resolvedColorMode,
      })
    }
  }

  watch(
    [themeId, () => colorMode.preference],
    () => {
      if (
        !import.meta.client ||
        applyingFromServer ||
        !userStore.user.uid ||
        !userStore.appearanceLoaded
      ) {
        return
      }

      if (
        userStore.appearance.theme !== themeId.value ||
        userStore.appearance.colorMode !== colorMode.preference
      ) {
        userStore.saveAppearance({
          theme: themeId.value,
          colorMode: colorMode.preference,
        })
      }
    },
    { flush: 'sync' },
  )

  watch(
    () => [
      userStore.appearanceLoaded,
      userStore.appearance,
      userStore.user.uid,
    ],
    ([loaded, appearance, uid]) => {
      if (!import.meta.client || !loaded || !uid) return
      applyServerAppearance(appearance as Appearance)
    },
    { deep: true, flush: 'sync', immediate: true },
  )

  function refreshAppearanceOnFocus() {
    if (document.visibilityState !== 'visible') return

    const uid = userStore.user.uid
    if (uid && !userStore.appearanceSaveTimer) {
      userStore.fetchUserPreferences(uid)
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', refreshAppearanceOnFocus)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', refreshAppearanceOnFocus)
  })
}
