<template>
  <UDashboardPanel id="home">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar :title="$config.public.site.name" />
    </template>

    <template #body>
      <UPageHero
        :title="`Welcome to ${$config.public.site.name}`"
        :description="$config.public.site.description"
        :links="[
          {
            label: 'Discover Keebdex',
            to: '/about',
            icon: 'solar:palette-bold-duotone',
            color: 'primary',
          },
        ]"
        :ui="{
          container: 'py-12 sm:py-16 lg:py-20',
          title:
            'bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text',
        }"
      />

      <ArtisanCollectorGuide />
    </template>
  </UDashboardPanel>
</template>
