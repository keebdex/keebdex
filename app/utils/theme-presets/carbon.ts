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
      secondary: 'carbon-beige',
      neutral: 'carbon-gray',
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
      ...palette('carbon-beige', {
        50: '#f4ecdc',
        100: '#e3d5b9',
        200: '#d0bd9d',
        300: '#b9a47f',
        400: '#9f895f',
        500: '#85714d',
        600: '#6b5a3e',
        700: '#534630',
        800: '#3d3323',
        900: '#2a2319',
        950: '#18140e',
      }),
      ...palette('carbon', {
        50: '#fff3e8',
        100: '#ffe3cc',
        200: '#ffc599',
        300: '#ffa766',
        400: '#ff8933',
        500: '#e86700',
        600: '#c95700',
        700: '#a84900',
        800: '#843a00',
        900: '#602b00',
        950: '#3d1b00',
      }),
      ...palette('carbon-gray', {
        50: '#f2f2f0',
        100: '#e3e4e1',
        200: '#c9cbc7',
        300: '#adafaa',
        400: '#91938f',
        500: '#777976',
        600: '#5c5d5b',
        700: '#464746',
        800: '#363735',
        900: '#272827',
        950: '#191a19',
      }),
    },
    light: {
      '--ui-bg': 'var(--ui-color-secondary-50)',
      '--ui-bg-muted': 'var(--ui-color-secondary-100)',
      '--ui-bg-elevated': 'var(--ui-color-secondary-100)',
      '--ui-bg-accented': 'var(--ui-color-secondary-200)',
      '--ui-bg-inverted': 'var(--ui-color-neutral-900)',
      '--ui-text-inverted': 'var(--ui-color-neutral-50)',
      '--ui-text-dimmed': 'var(--ui-color-neutral-500)',
      '--ui-text-muted': 'var(--ui-color-neutral-600)',
      '--ui-text-toned': 'var(--ui-color-neutral-700)',
      '--ui-text': 'var(--ui-color-neutral-800)',
      '--ui-text-highlighted': 'var(--ui-color-neutral-950)',
      '--ui-border': 'var(--ui-color-secondary-300)',
      '--ui-border-muted': 'var(--ui-color-secondary-200)',
      '--ui-border-accented': 'var(--ui-color-secondary-400)',
      '--ui-border-inverted': 'var(--ui-color-neutral-400)',
    },
    dark: {
      '--ui-bg': 'var(--ui-color-neutral-800)',
      '--ui-bg-muted': 'var(--ui-color-neutral-900)',
      '--ui-bg-elevated': 'var(--ui-color-neutral-900)',
      '--ui-bg-accented': 'var(--ui-color-neutral-950)',
      '--ui-bg-inverted': 'var(--ui-color-primary-500)',
      '--ui-text-dimmed': 'var(--ui-color-secondary-300)',
      '--ui-text-muted': 'var(--ui-color-secondary-200)',
      '--ui-text-toned': 'var(--ui-color-secondary-100)',
      '--ui-text': 'var(--ui-color-secondary-100)',
      '--ui-text-highlighted': 'var(--ui-color-secondary-50)',
      '--ui-text-inverted': 'var(--ui-color-neutral-950)',
      '--ui-border': 'var(--ui-color-neutral-600)',
      '--ui-border-muted': 'var(--ui-color-neutral-700)',
      '--ui-border-accented': 'var(--ui-color-neutral-500)',
      '--ui-border-inverted': 'var(--ui-color-primary-600)',
    },
  },
} satisfies ThemePreset
