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
        :description="$config.public.site.description"
        :links="[
          {
            label: 'About Keebdex',
            to: '/about',
            icon: 'solar:telescope-bold-duotone',
            ui: {
              label: 'block',
            },
          },
          {
            label: 'Why choose Keebdex?',
            to: '/why-choose-keebdex',
            icon: 'solar:star-fall-bold-duotone',
            color: 'primary',
            ui: {
              label: 'block',
            },
          },
        ]"
        :ui="{ container: 'py-12 sm:py-16 lg:py-20' }"
      >
        <template #title>
          Welcome to <AppWordmark size="2xl" inline />
        </template>
      </UPageHero>

      <FreshReleasesMarquee />

      <ArtisanCollectorGuide />

      <ShoutoutsMarquee />
    </template>
  </UDashboardPanel>
</template>
