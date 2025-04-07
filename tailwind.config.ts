// tailwind.config.ts
import type { Config } from 'tailwindcss'

import PrimeUI from 'tailwindcss-primeui'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './app.vue',
    './content/**/*.{md,mdx,json,yml,yaml}', // ✅ Important for Nuxt Content v3
  ],
  theme: {
    extend: {},
  },
  plugins: [PrimeUI, typography],
}

export default config
