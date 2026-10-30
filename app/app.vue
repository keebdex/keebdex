<template>
  <!-- Tooltips show at once: they name icon-only buttons -->
  <UApp
    :toaster="{ max: 5, expand: false }"
    :tooltip="{ delayDuration: 0 }"
  >
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
import { useUserStore } from './stores/user'

const config = useRuntimeConfig()
const userStore = useUserStore()

useSyncAppearance()

const client = useSupabaseClient()

// Restore the user on the client only, after hydration. Run during SSR, the
// unawaited call could resolve after parts of the page had rendered as a
// guest but before the store was serialized, so the client hydrated as signed
// in against guest HTML and Vue left mismatched classes and icons in place.
// The server always renders the guest view; signed-in UI follows on mount.
onMounted(() => {
  client.auth.getUser().then(({ data }) => {
    if (data.user) {
      userStore.setCurrentUser(data.user)
    } else {
      userStore.$reset()
    }
  })
})

const { name, description, homepage } = config.public.site

useHead({
  htmlAttrs: {
    lang: 'en',
  },
  link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
})

// Pages rendered on the client only (`ssr: false` in routeRules) are never
// seen by link preview crawlers, and nuxt-og-image throws in dev when an OG
// image is defined while mounting a page the server did not render
if (useNuxtApp().payload.serverRendered) {
  defineOgImage('Base', { description })
}

useSeoMeta({
  titleTemplate: (chunk) => {
    return chunk ? `${chunk} - ${name}` : name
  },
  description,
  ogType: 'website',
  ogUrl: homepage,
  ogTitle: name,
  ogDescription: description,
  twitterCard: 'summary_large_image',
  twitterTitle: name,
  twitterDescription: description,
})
</script>
