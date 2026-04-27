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
    families: [
      { name: 'Reddit Sans', global: true },
      { name: 'Reddit Mono', global: true },
      { name: 'Dosis', weights: [700, 800], global: true },
    ],
  },

  supabase: {
    redirect: false,
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
      ],
    },
  },
})
