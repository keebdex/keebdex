<template>
  <UError :error="page" />
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const NOT_FOUND = {
  statusCode: 404,
  statusMessage: 'Not Found',
  message: 'Sorry, the page you are looking for does not exist.',
  title: 'Page Not Found',
}

const SERVER_ERROR = {
  statusCode: 500,
  statusMessage: 'Internal Server Error',
  message: 'Uh oh. Something went wrong.',
  title: 'Something Went Wrong',
}

// Unknown routes and detail pages whose record does not exist
// (`throwIfNotFound`) both answer 404; anything else is a server error
const props = defineProps<{ error: NuxtError }>()

const page = computed(() =>
  props.error.statusCode === 404 ? NOT_FOUND : SERVER_ERROR,
)

// The error page replaces app.vue, and its titleTemplate with it
const { name } = useRuntimeConfig().public.site

useSeoMeta({
  title: () => `${page.value.title} - ${name}`,
  robots: 'noindex',
})
</script>
