import { palette, type ThemePreset } from './types'

export default {
  id: 'bubble-tea',
  label: 'Bubble Tea',
  icon: 'hugeicons:bubble-tea-01',
  ui: {
    colors: {
      primary: 'bubble-tea',
      //   secondary: 'bubble-tea-ink',
      info: 'teal',
      warning: 'yellow',
      neutral: 'bubble-tea-ink',
    },
    // button: {
    //   defaultVariants: {
    //     variant: 'solid',
    //   },
    // },
    // card: {
    //   defaultVariants: {
    //     variant: 'subtle',
    //   },
    // },
    // input: {
    //   defaultVariants: {
    //     variant: 'subtle',
    //   },
    // },
    // select: {
    //   defaultVariants: {
    //     variant: 'subtle',
    //   },
    // },
    // selectMenu: {
    //   defaultVariants: {
    //     variant: 'subtle',
    //   },
    // },
  },
  css: {
    root: {
      //   '--ui-radius': '0.625rem',
      ...palette('bubble-tea', {
        50: '#F8F4FA',
        100: '#EDE5F1',
        200: '#DCCCE3',
        300: '#C9B2D2',
        400: '#AD8CBD',
        500: '#8E71A2',
        600: '#765C87',
        700: '#5D466C',
        800: '#473351',
        900: '#302239',
        950: '#170B19',
      }),
      ...palette('bubble-tea-ink', {
        50: '#FBF9FC',
        100: '#F3EEF5',
        200: '#E5DCE9',
        300: '#D2C4D8',
        400: '#B7A4BE',
        500: '#957C9F',
        600: '#745A80',
        700: '#59425F',
        800: '#412F45',
        900: '#2B1D2E',
        950: '#170B19',
      }),
    },
    light: {
      '--ui-bg': 'var(--ui-color-neutral-50)',
      '--ui-bg-muted': 'var(--ui-color-neutral-100)',
      '--ui-bg-elevated': 'var(--ui-color-neutral-100)',
      '--ui-bg-accented': 'var(--ui-color-neutral-200)',
      '--ui-text': 'var(--ui-color-neutral-900)',
      '--ui-text-highlighted': 'var(--ui-color-neutral-950)',
      '--ui-border': 'var(--ui-color-neutral-300)',
      '--ui-border-muted': 'var(--ui-color-neutral-200)',
      '--ui-border-accented': 'var(--ui-color-neutral-400)',
    },
    dark: {
      '--ui-primary': 'var(--ui-color-primary-400)',
      '--ui-bg': 'var(--ui-color-neutral-950)',
      '--ui-bg-muted': 'var(--ui-color-neutral-900)',
      '--ui-bg-elevated': 'var(--ui-color-neutral-900)',
      '--ui-bg-accented': 'var(--ui-color-neutral-800)',
      '--ui-text': 'var(--ui-color-neutral-100)',
      '--ui-text-highlighted': 'var(--ui-color-neutral-50)',
      '--ui-border': 'var(--ui-color-neutral-800)',
      '--ui-border-muted': 'var(--ui-color-neutral-900)',
      '--ui-border-accented': 'var(--ui-color-neutral-700)',
    },
  },
} satisfies ThemePreset
