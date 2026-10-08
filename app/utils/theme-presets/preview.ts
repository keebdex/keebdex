import type { ThemePreset } from './types'

type Mode = 'light' | 'dark'

// Nuxt UI's defaults for the tokens the preview uses, applied when a preset
// does not override them.
const DEFAULT_TOKENS: Record<Mode, Record<string, string>> = {
  light: {
    '--ui-bg': 'var(--ui-color-white)',
    '--ui-bg-elevated': 'var(--ui-color-neutral-100)',
    '--ui-border': 'var(--ui-color-neutral-200)',
    '--ui-primary': 'var(--ui-color-primary-500)',
    '--ui-text-highlighted': 'var(--ui-color-neutral-900)',
  },
  dark: {
    '--ui-bg': 'var(--ui-color-neutral-900)',
    '--ui-bg-elevated': 'var(--ui-color-neutral-800)',
    '--ui-border': 'var(--ui-color-neutral-800)',
    '--ui-primary': 'var(--ui-color-primary-400)',
    '--ui-text-highlighted': 'var(--ui-color-white)',
  },
}

const COLOR_REF = /^var\(--ui-color-([a-z]+)-(\d+)\)$/

/**
 * Resolves a `--ui-*` token for a preset without relying on the active
 * theme's CSS variables, so a preview card shows that preset's real colors.
 */
export function resolvePresetToken(
  preset: ThemePreset,
  mode: Mode,
  token: string,
): string {
  const value = preset.css[mode]?.[token] ?? DEFAULT_TOKENS[mode][token]
  if (!value) return `var(${token})`
  if (value === 'var(--ui-color-white)') return '#ffffff'

  const match = value.match(COLOR_REF)
  if (!match) return value

  const [, alias, shade] = match
  const paletteName = preset.ui?.colors?.[alias] || alias
  const key = `--color-${paletteName}-${shade}`

  return preset.css.root?.[key] ?? `var(${key})`
}
