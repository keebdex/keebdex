const COLOR_MODES = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const

// Menu items shared by the profile menu and the command palette.
// `Theme` is the light/dark color mode and `Palette` is the theme preset,
// matching the Nuxt UI command palette's built-in "Theme" group.
export function useThemeMenu() {
  const appConfig = useAppConfig()
  const colorMode = useColorMode()
  const { themeId, presets, setTheme } = useAppTheme()

  const colorModeItems = computed(() =>
    COLOR_MODES.map((mode) => ({
      label: mode.label,
      icon: appConfig.ui.icons[mode.value],
      active: colorMode.preference === mode.value,
      onSelect: () => {
        colorMode.preference = mode.value
      },
    })),
  )

  const paletteItems = computed(() =>
    presets.map((preset) => ({
      label: preset.label,
      icon: preset.icon,
      active: themeId.value === preset.id,
      onSelect: () => setTheme(preset.id),
    })),
  )

  return {
    colorModeItems,
    paletteItems,
  }
}
