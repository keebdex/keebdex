<template>
  <UDashboardPanel
    v-if="content"
    :id="content.title"
    :ui="{ body: 'lg:py-12 max-w-none prose dark:prose-invert leading-tight' }"
  >
    <template #header>
      <UDashboardNavbar :title="content.title"> </UDashboardNavbar>
    </template>

    <template #body>
      <ContentRenderer :value="content" />
    </template>
  </UDashboardPanel>
  <UDashboardPanel v-else>
    <template #header>
      <UDashboardNavbar title="404"> </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHero
        title="Not Found"
        description="Sorry, the page you visited does not exist."
        :links="[
          {
            label: 'Back Home',
            to: '/',
            icon: 'hugeicons:home-01',
          },
        ]"
      >
        <!-- <NuxtImg class="w-1/3" src="/svg/404.svg" alt="Not Found" /> -->
      </UPageHero>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const route = useRoute()
const { data: content } = useAsyncData(route.path, () =>
  queryCollection('content').path(route.path).first(),
)
</script>
