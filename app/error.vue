<template>
  <UError :error="shown" />
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

// Unknown routes and detail pages whose record does not exist
// (`throwIfNotFound`) both answer 404; anything else is a server error
const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)

const shown = computed(() =>
  notFound.value
    ? {
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Sorry, the page you are looking for does not exist.',
      }
    : {
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: 'Uh oh. Something went wrong.',
      },
)

// The error page replaces app.vue, and its titleTemplate with it
const { name } = useRuntimeConfig().public.site

useSeoMeta({
  title: () =>
    `${notFound.value ? 'Page Not Found' : 'Something Went Wrong'} - ${name}`,
  robots: 'noindex',
})
</script>
