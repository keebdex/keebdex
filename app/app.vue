<template>
  <UApp>
    <Analytics />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
import { Analytics } from '@vercel/analytics/nuxt'
import { useUserStore } from './stores/user'
import 'flag-icons/css/flag-icons.min.css'

const config = useRuntimeConfig()
const userStore = useUserStore()

const client = useSupabaseClient()

client.auth.getUser().then(({ data }) => {
  if (data.user) {
    userStore.setCurrentUser(data.user)
  } else {
    userStore.$reset()
  }
})

const { name, description, homepage } = config.app

useHead({
  htmlAttrs: {
    lang: 'en',
  },
  link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
})

defineOgImage()

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
