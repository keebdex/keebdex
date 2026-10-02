import defaultTheme from './default'
import bubbleTea from './bubble-tea'
import carbon from './carbon'
import parchment from './parchment'

export type { ThemePreset } from './types'
export { presetToCss } from './types'

export const THEME_COOKIE = 'app-theme'
export const DEFAULT_THEME_ID = 'default'

export const themePresets = [defaultTheme, bubbleTea, carbon, parchment]

export function findPreset(id?: string | null) {
  return (
    themePresets.find((preset) => preset.id === id) ||
    themePresets.find((preset) => preset.id === DEFAULT_THEME_ID)!
  )
}
