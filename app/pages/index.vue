<template>
  <UDashboardPanel id="home">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar :title="$config.public.site.name">
        <template #right>
          <ProfileMenu :collapsed="true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHero
        :title="`Welcome to ${$config.public.site.name}`"
        :description="$config.public.site.description"
        :links="[
          {
            label: 'Meet the Makers',
            to: '/artisan/maker',
            icon: 'solar:palette-bold-duotone',
            color: 'primary',
            block: $device.isMobile,
            ui: {
              label: 'block',
            },
          },
          {
            label: 'Explore Keysets',
            to: '/keycap?status=live',
            icon: 'solar:layers-bold-duotone',
            color: 'primary',
            block: $device.isMobile,
            ui: {
              label: 'block',
            },
          },
        ]"
        :ui="{
          container: 'py-12 sm:py-16 lg:py-20',
          title:
            'bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text',
        }"
      />

      <FreshReleasesMarquee />

      <ArtisanCollectorGuide />
    </template>
  </UDashboardPanel>
</template>
