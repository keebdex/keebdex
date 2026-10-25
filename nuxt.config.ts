import { defineNuxtConfig } from 'nuxt/config'
import { execSync } from 'child_process'
import app from './package.json'

const revision = execSync('git rev-parse --short HEAD').toString().trim()

const isProduction = process.env.NODE_ENV === 'production'

// Cloudflare builds (an explicit preset, or Pages / Workers CI, which Nitro
// detects the same way) store Nuxt Content collections in D1.
const isCloudflare =
  process.env.NITRO_PRESET?.includes('cloudflare') ||
  !!process.env.CF_PAGES ||
  !!process.env.WORKERS_CI

// https://nuxt.com/docs/api/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-14',

  build: {
    // fixing @babel/runtime issue in production build
    transpile: [...(isProduction ? ['@babel/runtime'] : [])],
  },

  nitro: {
    // Nitro detects Workers Builds by itself, but nuxt-og-image reads the
    // preset from this config (or NITRO_PRESET) and otherwise falls back to
    // node-server: OG images then fetch their fonts through Nitro, which
    // does not serve public assets on Workers, instead of the ASSETS binding,
    // and render every font as the default sans-serif
    preset: isCloudflare
      ? process.env.NITRO_PRESET || 'cloudflare_module'
      : undefined,
    rollupConfig: {
      // Exclude papaparse from the server bundle
      external: ['papaparse'],
    },
  },

  // Each SSR request runs on a Cloudflare Worker with 10 ms of CPU on the
  // Free plan. Static pages are prerendered, and pages that are private or
  // tools without search value render on the client, so the Worker only sends
  // the app shell. Public catalog pages keep SSR for search engines and link
  // previews. Rendered HTML is not cached: it depends on the theme and color
  // mode cookies and on the device.
  routeRules: {
    '/about': { prerender: true },
    '/changelog': { prerender: true },
    '/privacy': { prerender: true },
    '/why-choose-keebdex': { prerender: true },

    '/account/**': { ssr: false },
    '/admin/**': { ssr: false },
    '/notifications': { ssr: false },
    '/recent-changes': { ssr: false },
    '/collection': { ssr: false },
    '/collection/artisan/*/sort': { ssr: false },
    '/artisan/wishlist': { ssr: false },
    // Long lists (up to 1000 trade items, 72 search results) take 50-150 ms
    // to render on the server
    '/artisan/marketplace': { ssr: false },
    '/artisan/search': { ssr: false },
    '/artisan/submissions/**': { ssr: false },
    '/keyboard/submissions/**': { ssr: false },
    '/keyset/submissions/**': { ssr: false },
    '/keyboard/brand/*/*/sort': { ssr: false },
    '/keyset/*/*/color': { ssr: false },
    '/keyset/*/*/kit': { ssr: false },
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
    'nuxt-og-image',
  ],

  fonts: {
    // Every family below (and in the theme presets) is a Google Font, so skip
    // the other providers (bunny, fontshare, fontsource, …), which can fetch
    // their font lists over the network at startup
    provider: 'google',
    defaults: { weights: [400, 500, 600, 700] },
    families: [
      { name: 'Reddit Sans', global: true },
      { name: 'Reddit Mono', global: true },
      { name: 'Dosis', weights: [500, 700, 800], global: true },
      { name: 'Cinzel', global: true },
      { name: 'Outfit', global: true },
      { name: 'Cardo', global: true },
    ],
  },

  // NuxtImg resizes Cloudflare Images URLs (imagedelivery.net) through
  // flexible variants wherever a preset or `sizes` applies; every other source,
  // such as the 500x500 logos on R2 (img.keebdex.org), is returned as is.
  // Preset sizes are the widest share of the viewport an image takes in each
  // range, measured in the app. NuxtImg derives srcset widths from each
  // range's lower breakpoint, so the grids add x3 to keep a candidate large
  // enough for retina screens
  image: {
    // Default for every NuxtImg: presets cannot pick a provider (it is
    // resolved before the preset is merged), and the provider leaves the
    // sources it does not handle unchanged
    provider: 'cloudflare',
    providers: {
      // Overrides @nuxt/image's built-in `cloudflare` provider, which targets
      // Image Resizing (`/cdn-cgi/image/...`), not Cloudflare Images
      cloudflare: { provider: '~/providers/cloudflare-images.ts' },
    },
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
      '3xl': 1792,
      '4xl': 2048,
    },
    presets: {
      // Artisan colorways in artisanGridClass: 2 / md 3 / lg 4 / 2xl 6 / 4xl 9
      // columns
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

  // On Cloudflare, @nuxt/icon would serve icons from the Worker
  // (/api/_nuxt_icon) by downloading and parsing whole collections from
  // jsDelivr in every new isolate (solar 11.7 MB, simple-icons 4.8 MB,
  // hugeicons 3.5 MB: about 3-15 ms of CPU and 4-12 MB of memory each). The
  // icons named in the code are bundled instead (SSR reads the same bundle),
  // and the rest, such as announcement icons from the database, load from the
  // Iconify API.
  icon: {
    provider: 'iconify',
    clientBundle: {
      scan: {
        globInclude: ['app/**/*.{vue,ts,js}', 'content/**/*.md'],
      },
      sizeLimitKb: 512,
    },
  },

  // The changelog collection is read from the keebdex-db D1 database, bound
  // to the Worker as DB. Dev and other hosts use Nuxt Content's SQLite.
  content: isCloudflare ? { database: { type: 'd1', bindingName: 'DB' } } : {},

  // Absolute og:image URLs for the OG images of prerendered pages, which have
  // no request host to build them from (NUXT_SITE_URL overrides it)
  site: {
    url: app.homepage,
  },

  supabase: {
    redirect: false,
  },

  colorMode: {
    storage: 'cookie',
  },

  // Semver build metadata, also shown as the unreleased notes' badge on
  // /changelog.
  buildId: `v${app.version}+${revision}`,

  runtimeConfig: {
    cloudflare: {
      accountId: '',
      imagesApiToken: '',
    },
    public: {
      imgUrl: 'https://img.keebdex.org',
      cloudflare: {
        // Cloudflare Images account hash (https://imagedelivery.net/<hash>/…):
        // only images on this account get resized variants
        accountHash: 'AoGTnmznzkqXfjeHrFtGwg',
      },
      upload: {
        max_image_size: {
          // MB
          artisan: 10,
          keyboard: 20,
          keyset: 10,
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
    build: {
      // Keep flag-icons' ~540 SVG flags as files instead of data URIs in its
      // stylesheet, which otherwise weighs ~420 kB
      assetsInlineLimit: (filePath) =>
        filePath.includes('/flag-icons/') ? false : undefined,
    },
    optimizeDeps: {
      include: [
        '@internationalized/date',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueuse/core',
        'es-toolkit/compat',
        'modern-screenshot',
        'papaparse', // CJS
        'vuedraggable', // CJS
        'zod',
      ],
    },
  },
})
