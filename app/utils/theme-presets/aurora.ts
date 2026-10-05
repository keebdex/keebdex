import { palette, type ThemePreset } from './types'

export default {
  id: 'aurora',
  label: 'Aurora',
  icon: 'hugeicons:triangle',
  ui: {
    colors: {
      primary: 'teal',
      secondary: 'violet',
      success: 'emerald',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'slate',
    },
  },
  css: {
    root: {
      '--ui-radius': '0.25rem',
      // Keep these Tailwind slate overrides so Aurora's preview resolves the
      // intended shades: https://tailwindcss.com/docs/colors#overriding-default-colors
      ...palette('slate', {
        50: 'oklch(98.4% 0.003 247.858)',
        100: ' oklch(96.8% 0.007 247.896)',
        200: ' oklch(92.9% 0.013 255.508)',
        300: ' oklch(86.9% 0.022 252.894)',
        400: ' oklch(70.4% 0.04 256.788)',
        500: ' oklch(55.4% 0.046 257.417)',
        600: ' oklch(44.6% 0.043 257.281)',
        700: ' oklch(37.2% 0.044 257.287)',
        800: ' oklch(27.9% 0.041 260.031)',
        900: ' oklch(20.8% 0.042 265.755)',
        950: ' oklch(12.9% 0.042 264.695)',
      }),
    },
  },
} satisfies ThemePreset
