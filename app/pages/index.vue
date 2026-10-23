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
        :ui="{
          container: 'py-10 sm:py-16 lg:py-20',
          description: 'text-base sm:text-xl/8',
          links: 'mt-6 sm:mt-10',
        }"
      >
        <template #title>
          Welcome to
          <AppWordmark :size="$device.isMobile ? 'xl' : '2xl'" inline />
        </template>
      </UPageHero>

      <HomeFreshReleases />

      <HomeArtisanGuides />

      <HomeShoutouts />
    </template>
  </UDashboardPanel>
</template>
