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
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'lodash.sortby', // CJS
        'zod',
        '@internationalized/date',
        'modern-screenshot',
        'lodash.groupby', // CJS
        'vuedraggable', // CJS
      ],
    },
  },
})
