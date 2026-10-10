<template>
  <UApp :toaster="{ max: 5 }">
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
import { useUserStore } from './stores/user'
import 'flag-icons/css/flag-icons.min.css'

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

defineOgImage('Base', { description })

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
