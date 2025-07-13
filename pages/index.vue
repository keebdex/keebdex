<template>
  <UDashboardPanel id="home">
    <template #body>
      <UPageHero
        :title="`Welcome to ${$config.app.name}`"
        :description="$config.app.description"
        :ui="{
          title:
            'bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text',
        }"
      />

      <ArtisanCollectorGuide />
    </template>
  </UDashboardPanel>
</template>

<!-- <script setup>
const { data } = await useAsyncData(() => $fetch('/api/statistics'))

const features = [
  {
    title: 'Discover Your Next Gem',
    description: 'Explore a vast library of artisan keycaps and keycap sets.',
  },
  {
    title: 'Organize Your Collection',
    description:
      'Effortlessly manage your entire collection – from individual artisan keycaps to complete keycap sets.',
  },
]
</script> -->
