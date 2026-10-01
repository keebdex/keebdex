// eslint-disable-next-line @typescript-eslint/no-import-type-side-effects
import { type ThemePreset } from './types'

export default {
  id: 'default',
  label: 'Default',
  icon: 'hugeicons:triangle',
  ui: {
    colors: {
      primary: 'teal',
      secondary: 'violet',
      success: 'emerald',
      info: 'sky',
      error: 'red',
      warning: 'amber',
    },
  },
  css: {},
} satisfies ThemePreset
