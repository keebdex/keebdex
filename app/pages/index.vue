<template>
  <UDashboardPanel id="home">
    <template v-if="$device.isMobile" #header>
      <UDashboardNavbar :title="$config.app.name"> </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHero
        :title="`Welcome to ${$config.app.name}`"
        :description="$config.app.description"
        :links="[
          {
            label: 'Why choose Keebdex',
            to: '/why-choose-keebdex',
            icon: 'solar:rocket-bold-duotone',
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
