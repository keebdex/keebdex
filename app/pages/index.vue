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
        :ui="{
          container: 'py-10 sm:py-16 lg:py-20',
          description: 'text-base sm:text-xl/8',
          footer: 'mt-6 sm:mt-10',
        }"
      >
        <template #title>
          Welcome to
          <AppWordmark :size="$device.isMobile ? 'xl' : '2xl'" inline />
        </template>

        <template #links>
          <!-- Guests land on the collection sign-in page. -->
          <UButton
            :label="authenticated ? 'My Collection' : 'Start Collecting'"
            to="/collection"
            icon="hugeicons:collections-bookmark"
            color="primary"
            size="xl"
            :ui="{ label: 'block' }"
          />
          <UDashboardSearchButton
            label="Search Keebdex"
            size="xl"
            variant="soft"
            :ui="{ label: 'block' }"
          />

          <div class="flex basis-full justify-center">
            <UButton
              label="Why Choose Keebdex?"
              to="/why-choose-keebdex"
              variant="link"
              trailing-icon="hugeicons:arrow-right-02"
              :ui="{ label: 'block' }"
            />
          </div>
        </template>
      </UPageHero>

      <HomeFreshReleases />

      <HomeArtisanGuides />

      <HomeTopContributors />

      <HomeShoutouts />
    </template>
  </UDashboardPanel>
</template>

<script setup>
const { authenticated } = storeToRefs(useUserStore())
</script>
