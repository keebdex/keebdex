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
      primary: 'carbon',
      warning: 'carbon',
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
      '--font-sans': "'Outfit', sans-serif",
      ...palette('carbon', {
        50: '#f4ecdc',
        100: '#e3d5b9',
        200: '#d0bd9d',
        300: '#b9a47f',
        400: '#9f895f',
        500: '#e86700',
        600: '#5c5d5b',
        700: '#464746',
        800: '#363735',
        900: '#272827',
        950: '#191a19',
      }),
    },
    light: {
      '--ui-bg': 'var(--ui-color-neutral-50)',
      '--ui-bg-muted': 'var(--ui-color-neutral-100)',
      '--ui-bg-elevated': 'var(--ui-color-neutral-100)',
      '--ui-bg-accented': 'var(--ui-color-neutral-200)',
      '--ui-bg-inverted': 'var(--ui-color-neutral-600)',
      '--ui-text-inverted': 'var(--ui-color-neutral-100)',
      '--ui-text-dimmed': 'var(--ui-color-neutral-600)',
      '--ui-text-muted': 'var(--ui-color-neutral-700)',
      '--ui-text-toned': 'var(--ui-color-neutral-700)',
      '--ui-text': 'var(--ui-color-neutral-700)',
      '--ui-text-highlighted': 'var(--ui-color-neutral-800)',
      '--ui-border': 'var(--ui-color-neutral-300)',
      '--ui-border-muted': 'var(--ui-color-neutral-200)',
      '--ui-border-accented': 'var(--ui-color-neutral-400)',
      '--ui-border-inverted': 'var(--ui-color-neutral-600)',
    },
    dark: {
      '--ui-bg': 'var(--ui-color-neutral-700)',
      '--ui-bg-muted': 'var(--ui-color-neutral-800)',
      '--ui-bg-elevated': 'var(--ui-color-neutral-800)',
      '--ui-bg-accented': 'var(--ui-color-neutral-900)',
      '--ui-bg-inverted': 'var(--ui-color-primary-500)',
      '--ui-text-dimmed': 'var(--ui-color-neutral-300)',
      '--ui-text-muted': 'var(--ui-color-neutral-200)',
      '--ui-text-toned': 'var(--ui-color-neutral-100)',
      '--ui-text': 'var(--ui-color-neutral-100)',
      '--ui-text-highlighted': 'var(--ui-color-neutral-100)',
      '--ui-text-inverted': 'var(--ui-color-neutral-950)',
      '--ui-border': 'var(--ui-color-neutral-800)',
      '--ui-border-muted': 'var(--ui-color-neutral-700)',
      '--ui-border-accented': 'var(--ui-color-neutral-600)',
      '--ui-border-inverted': 'var(--ui-color-primary-500)',
    },
  },
} satisfies ThemePreset
