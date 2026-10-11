import { defineNuxtConfig } from 'nuxt/config'
import { execSync } from 'child_process'
import app from './package.json'

const revision = execSync('git rev-parse --short HEAD').toString().trim()

const isProduction = process.env.NODE_ENV === 'production'

// https://nuxt.com/docs/api/nuxt-config
export default defineNuxtConfig({
  build: {
    // fixing @babel/runtime issue in production build
    transpile: [...(isProduction ? ['@babel/runtime'] : [])],
  },

  nitro: {
    rollupConfig: {
      // Exclude papaparse from the server bundle
      external: ['papaparse'],
    },
  },

  css: ['~/assets/main.css'],

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts', // for rendering fonts in og images
    '@nuxtjs/device',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@vercel/analytics',
    '@vercel/speed-insights',
    'nuxt-og-image',
  ],

  fonts: {
    defaults: { weights: [400, 500, 600, 700] },
    families: [
      { name: 'Reddit Sans', global: true },
      { name: 'Reddit Mono', global: true },
      { name: 'Dosis', weights: [500, 700, 800], global: true },
      { name: 'Cinzel', global: true },
      { name: 'Outfit', global: true },
      { name: 'Source Serif 4', global: true },
    ],
  },

  // Cloudflare Images URLs are resized through flexible variants wherever a
  // preset or `sizes` applies; the provider returns every other source as is.
  // Preset sizes are the widest share of the viewport an image takes in each
  // range, measured in the app. NuxtImg sizes a range from its lower
  // breakpoint, so the grids add x3 to give retina screens a large enough pick
  image: {
    provider: 'cloudflare',
    providers: {
      cloudflare: { provider: '~/providers/cloudflare-images.ts' },
    },
    screens: {
      'xs': 320,
      'sm': 640,
      'md': 768,
      'lg': 1024,
      'xl': 1280,
      '2xl': 1536,
      '3xl': 1792,
      '4xl': 2048,
    },
    presets: {
      // squareGridClass: 2 / md 3 / lg 4 / 2xl 6 / 4xl 9 columns
      square: {
        sizes: 'xs:42vw md:28vw lg:18vw 2xl:13vw 4xl:8vw',
        densities: 'x1 x2 x3',
      },
      // Keyset and keyboard covers in UPageGrid: 1 / sm 2 / lg 3 / 2xl 4 /
      // 3xl 6 columns
      cover: {
        sizes: 'xs:92vw sm:44vw lg:25vw 2xl:19vw 3xl:13vw',
        densities: 'x1 x2 x3',
      },
      // Review queue thumbnails (size-10 / size-12)
      thumb: {
        sizes: '48px',
      },
    },
  },

  // icon: {
  //   clientBundle: {
  //     icons: ['hugeicons', 'simple-icons', 'solar'],
  //   },
  // },

  supabase: {
    redirect: false,
  },

  colorMode: {
    storage: 'cookie',
  },

  buildId: `v${app.version} (${revision})`,

  runtimeConfig: {
    cloudflare: {
      accountId: process.env.CF_IMAGES_ACCOUNT_ID,
      imagesApiToken: process.env.CF_IMAGES_API_KEY,
      imagesDeliveryBaseUrl: process.env.CF_IMAGES_DELIVERY_URL,
      imagesDefaultVariant: process.env.CF_IMAGES_VARIANT || 'public',
    },
    public: {
      imgUrl: process.env.IMG_URL || 'https://img.keebdex.org',
      upload: {
        max_image_size: {
          artisan: Number(process.env.UPLOAD_MAX_ARTISAN_IMAGE_SIZE_MB) || 5,
          keyboard: Number(process.env.UPLOAD_MAX_KEYBOARD_IMAGE_SIZE_MB) || 20,
          keyset: Number(process.env.UPLOAD_MAX_KEYSET_IMAGE_SIZE_MB) || 10,
        },
      },
      site: {
        name: app.displayName,
        description: app.description,
        homepage: app.homepage,
      },
    },
  },

  // pre-bundling to avoid page reloads
  vite: {
    optimizeDeps: {
      include: [
        '@internationalized/date',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'lodash.groupby', // CJS
        'lodash.sortby', // CJS
        'modern-screenshot',
        'papaparse', // CJS
        'vuedraggable', // CJS
        'zod',
        '@vueuse/core',
      ],
    },
  },
})
