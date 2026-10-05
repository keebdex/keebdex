import aurora from './aurora'
import taro from './taro'
import carbon from './carbon'
import eva01 from './eva-01'
import parchment from './parchment'

export type { ThemePreset } from './types'
export { presetToCss } from './types'

export const THEME_COOKIE = 'app-theme'
export const DEFAULT_THEME_ID = 'aurora'

export const themePresets = [aurora, carbon, eva01, parchment, taro]

export function findPreset(id?: string | null) {
  return (
    themePresets.find((preset) => preset.id === id) ||
    themePresets.find((preset) => preset.id === DEFAULT_THEME_ID)!
  )
}
