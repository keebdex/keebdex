import { palette, type ThemePreset } from './types'

export default {
  id: 'parchment',
  label: 'Parchment',
  icon: 'hugeicons:scroll-text',
  ui: {
    colors: {
      primary: 'clay',
      neutral: 'parchment',
    },
  },
  css: {
    root: {
      '--ui-radius': '0.375rem',
      //   '--font-sans': "'DM Sans', sans-serif",
      '--font-serif': "'Source Serif 4', serif",
      ...palette('clay', {
        50: 'oklch(97.4% 0.009 48.308)',
        100: 'oklch(94.2% 0.019 52.207)',
        200: 'oklch(88.5% 0.036 51.142)',
        300: 'oklch(82.1% 0.058 50.392)',
        400: 'oklch(74.1% 0.094 47.255)',
        500: 'oklch(67.2% 0.131 38.798)',
        600: 'oklch(58.9% 0.138 37.63)',
        700: 'oklch(51.4% 0.123 37.45)',
        800: 'oklch(44.4% 0.103 36.916)',
        900: 'oklch(38.8% 0.086 36.46)',
        950: 'oklch(25.9% 0.054 38.197)',
      }),
      ...palette('parchment', {
        50: 'oklch(98% 0.006 100)',
        100: 'oklch(96.5% 0.011 99)',
        200: 'oklch(93.6% 0.014 97.348)',
        300: 'oklch(85.8% 0.018 100)',
        400: 'oklch(72.1% 0.015 102.54)',
        500: 'oklch(57.8% 0.008 88.877)',
        600: 'oklch(43.2% 0.006 91.526)',
        700: 'oklch(38.2% 0.003 84.572)',
        800: 'oklch(29.3% 0.003 106.588)',
        900: 'oklch(21.7% 0.002 106.561)',
        950: 'oklch(14.6% 0 0)',
      }),
    },
    headings: {
      'font-family': 'var(--font-serif)',
    },
    light: {
      '--ui-bg': 'var(--ui-color-neutral-100)',
      '--ui-bg-muted': 'var(--ui-color-neutral-200)',
      '--ui-bg-elevated': 'var(--ui-color-neutral-200)',
      '--ui-bg-accented': 'var(--ui-color-neutral-300)',
      '--ui-border': 'var(--ui-color-neutral-300)',
      '--ui-border-muted': 'var(--ui-color-neutral-300)',
      '--ui-border-accented': 'var(--ui-color-neutral-400)',
    },
    dark: {
      '--ui-primary': 'var(--ui-color-primary-500)',
      '--ui-bg-accented': 'var(--ui-color-neutral-800)',
    },
  },
} satisfies ThemePreset
