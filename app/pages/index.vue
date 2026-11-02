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

        <!-- Each section fades up as it scrolls into view (main.css) -->
        <HomeHappeningNow class="home-reveal" />

        <HomeBrowseDex class="home-reveal" />

        <HomeTopContributors class="home-reveal" />

        <HomeShoutouts class="home-reveal" />

        <HomeArtisanGuides class="home-reveal" />

        <HomeContribute class="home-reveal" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
// The home page names what the site holds in its title, without the
// " - Keebdex" suffix, and keeps the site-wide OG image from app.vue
useSeoMeta({
  titleTemplate: '%s',
  title: 'Keebdex: Artisan Keycaps, Keysets, and Keyboards',
  description:
    'Keebdex catalogs artisan keycaps, keysets, and mechanical keyboards. Browse makers and group buys, track your collection, and trade caps with other collectors.',
})
</script>
