// tailwind.config.ts
import type { Config } from 'tailwindcss'

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
  plugins: [typography],
}

export default config
