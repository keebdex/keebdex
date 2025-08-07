<template>
  <UDashboardPanel
    v-if="content"
    :id="content.title"
    :ui="{ body: 'lg:py-12 max-w-none prose dark:prose-invert leading-tight' }"
  >
    <template #header>
      <UDashboardNavbar :title="content.title" />
    </template>

    <template #body>
      <ContentRenderer :value="content" />
    </template>
  </UDashboardPanel>
  <UDashboardPanel v-else>
    <template #header>
      <UDashboardNavbar title="404" />
    </template>

    <template #body>
      <UError
        :error="{
          statusCode: 404,
          statusMessage: 'Not Found',
          message: 'Sorry, the page you are looking for does not exist.',
        }"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
const route = useRoute()
const { data: content } = useAsyncData(route.path, () =>
  queryCollection('content').path(route.path).first(),
)
</script>
