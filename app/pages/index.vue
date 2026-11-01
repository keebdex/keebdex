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
      <div
        class="mx-auto flex w-full max-w-(--ui-container) flex-col gap-16 pb-6 sm:gap-24 sm:px-2 lg:px-6"
      >
        <HomeHero />

        <HomeHappeningNow />

        <HomeBrowseDex />

        <HomeTopContributors />

        <HomeShoutouts />

        <HomeArtisanGuides />

        <HomeContribute />
      </div>
    </template>
  </UDashboardPanel>
</template>
