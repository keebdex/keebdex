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
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/device',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    'nuxt-og-image',
  ],

  content: {
    database: {
      type: 'd1',
      bindingName: 'KEEBDEX_DB',
    },
  },

  ogImage: {
    defaults: {
      component: 'Website',
    },
    fonts: ['Dosis:500', 'Dosis:600'],
  },

  supabase: {
    redirect: false,
  },

  buildId: `v${app.version} (${revision})`,

  runtimeConfig: {
    app: {
      name: app.displayName,
      description: app.description,
      homepage: app.homepage,
    },
  },
})
