<template>
  <Panel
    v-if="content"
    :header="content.title"
    pt:root:class="!border-0 !bg-transparent"
    pt:title:class="flex items-center gap-4 font-medium text-3xl"
    pt:content:class="max-w-none prose dark:prose-invert leading-tight"
  >
    <ContentRenderer :value="content" />
  </Panel>
  <Panel v-else pt:root:class="!border-0 !bg-transparent">
    <div class="flex flex-col items-center gap-8">
      <NuxtImg class="w-1/3" src="/svg/404.svg" alt="Not Found" />

      <div class="text-2xl">Sorry, the page you visited does not exist.</div>

      <nuxt-link to="/">
        <Button label="Back Home" icon="pi pi-home" />
      </nuxt-link>
    </div>
  </Panel>
</template>

<script setup>
const route = useRoute()
const { data: content } = useAsyncData(route.path, () =>
  queryCollection('content').path(route.path).first(),
)
</script>
