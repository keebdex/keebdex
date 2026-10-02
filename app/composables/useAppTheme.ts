import {
  DEFAULT_THEME_ID,
  findPreset,
  THEME_COOKIE,
  themePresets,
} from '~/utils/theme-presets'

export function useAppTheme() {
  const cookie = useCookie<string>(THEME_COOKIE, {
    default: () => DEFAULT_THEME_ID,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  const id = useState<string>('app-theme-id', () => findPreset(cookie.value).id)

  watch(id, (value) => {
    cookie.value = value
  })

  watch(cookie, (value) => {
    const nextId = findPreset(value).id
    if (id.value !== nextId) id.value = nextId
  })

  const preset = computed(() => findPreset(id.value))

  function setTheme(next: string) {
    id.value = findPreset(next).id
  }

  return {
    themeId: computed(() => preset.value.id),
    preset,
    presets: themePresets,
    setTheme,
  }
}
