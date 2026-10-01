import { palette, type ThemePreset } from './types'

const inputDefaults = {
  defaultVariants: {
    variant: 'subtle',
  },
}

export default {
  id: 'carbon',
  label: 'Carbon',
  icon: 'hugeicons:hexagon',
  ui: {
    colors: {
      primary: 'amber',
      secondary: 'yellow',
      neutral: 'carbon',
    },
    button: {
      defaultVariants: {
        variant: 'solid',
      },
    },
    badge: {
      defaultVariants: {
        variant: 'solid',
      },
    },
    card: {
      defaultVariants: {
        variant: 'subtle',
      },
    },
    alert: {
      defaultVariants: {
        variant: 'subtle',
      },
    },
    empty: {
      defaultVariants: {
        variant: 'subtle',
      },
    },
    input: inputDefaults,
    select: inputDefaults,
    textarea: inputDefaults,
    selectMenu: inputDefaults,
    inputMenu: inputDefaults,
    inputNumber: inputDefaults,
    inputTags: inputDefaults,
    inputDate: inputDefaults,
    inputTime: inputDefaults,
    pinInput: inputDefaults,
  },
  css: {
    root: {
      '--ui-radius': '0.5rem',
      '--font-sans': "'Outfit', ui-sans-serif, system-ui, sans-serif",
      ...palette('carbon', {
        50: 'oklch(98.5% 0.017 447.457)',
        100: 'oklch(95.9% 0.036 438.639)',
        200: 'oklch(92.6% 0.054 428.8)',
        300: 'oklch(87% 0.053 417.734)',
        400: 'oklch(70.5% 0.032 405.184)',
        500: 'oklch(55.3% 0.014 390.836)',
        600: 'oklch(44.7% 0.001 374.343)',
        700: 'oklch(35.9% 0 0)',
        800: 'oklch(28% 0 0)',
        900: 'oklch(20.8% 0 0)',
        950: 'oklch(14.1% 0.005 285.805)',
      }),
    },
    light: {
      '--ui-bg': 'var(--ui-color-neutral-50)',
      '--ui-bg-muted': 'var(--ui-color-neutral-300)',
      '--ui-bg-elevated': 'var(--ui-color-neutral-300)',
      '--ui-bg-accented': 'var(--ui-color-neutral-400)',
      '--ui-bg-inverted': 'var(--ui-color-neutral-900)',
      '--ui-text-inverted': 'var(--ui-color-neutral-50)',
      '--ui-text-dimmed': 'var(--ui-color-neutral-500)',
      '--ui-text-muted': 'var(--ui-color-neutral-800)',
      '--ui-text-toned': 'var(--ui-color-neutral-900)',
      '--ui-text': 'var(--ui-color-neutral-900)',
      '--ui-text-highlighted': 'var(--ui-color-neutral-950)',
      '--ui-border': 'var(--ui-color-neutral-950)',
      '--ui-border-muted': 'var(--ui-color-neutral-400)',
      '--ui-border-accented': 'var(--ui-color-neutral-950)',
      '--ui-border-inverted': 'var(--ui-color-neutral-500)',
    },
    dark: {
      '--ui-bg': 'var(--ui-color-neutral-800)',
      '--ui-bg-muted': 'var(--ui-color-neutral-700)',
      '--ui-bg-elevated': 'var(--ui-color-neutral-700)',
      '--ui-bg-accented': 'var(--ui-color-neutral-600)',
      '--ui-bg-inverted': 'var(--ui-color-neutral-50)',
      '--ui-text-dimmed': 'var(--ui-color-neutral-400)',
      '--ui-text-muted': 'var(--ui-color-neutral-300)',
      '--ui-text-highlighted': 'var(--ui-color-neutral-100)',
      '--ui-border': 'var(--ui-color-neutral-600)',
      '--ui-border-accented': 'var(--ui-color-neutral-500)',
      '--ui-border-inverted': 'var(--ui-color-neutral-50)',
    },
  },
} satisfies ThemePreset
