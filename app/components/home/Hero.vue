<template>
  <UPageHero
    orientation="horizontal"
    headline="The keyboard collector's index"
    :description="$config.public.site.description"
    :ui="{
      // The page already sets the width and gutters
      container:
        'px-0 sm:px-0 lg:px-0 py-4 sm:py-10 lg:py-16 gap-10 sm:gap-y-10 lg:gap-16',
      // Each part rises in after the one above it (home-rise, main.css); the
      // title, the largest paint, goes first with the headline
      headline: ['mb-4 text-primary home-rise', eyebrowClass],
      title:
        'text-4xl sm:text-5xl xl:text-6xl text-balance home-rise',
      description: 'mt-5 max-w-xl home-rise [--i:1]',
      body: 'mt-8 home-rise [--i:2]',
      footer: 'mt-10 home-rise [--i:3]',
    }"
  >
    <template #title>
      Every artisan, keyset, and keyboard, in
      <span class="text-primary">one dex</span>.
    </template>

    <template #body>
      <UDashboardSearchButton
        label="Search makers, colorways, keysets…"
        variant="outline"
        size="xl"
        class="w-full max-w-lg"
        :ui="{ label: 'block truncate', trailing: 'ms-auto' }"
      />

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <!-- Guests land on the collection sign-in page. -->
        <UButton
          :label="authenticated ? 'My Collection' : 'Start Collecting'"
          to="/collection"
          icon="solar:bookmark-square-bold-duotone"
          color="primary"
          size="lg"
          :ui="{ label: 'block' }"
        />
        <UButton
          label="Why Choose Keebdex?"
          to="/why-choose-keebdex"
          variant="link"
          size="lg"
          trailing-icon="solar:arrow-right-linear"
          :ui="{ label: 'block' }"
        />
      </div>
    </template>

    <template v-if="stats.length" #footer>
      <dl class="grid w-full grid-cols-2 gap-y-6 sm:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="flex flex-col-reverse gap-1 border-s border-default ps-4"
        >
          <dt class="text-sm text-muted">{{ stat.label }}</dt>
          <dd
            class="font-mono text-2xl font-semibold tabular-nums text-highlighted"
          >
            {{ stat.value }}
          </dd>
        </div>
      </dl>
    </template>

    <HomeKeycapMosaic v-if="data.showcase.length >= 8" :items="data.showcase" />
  </UPageHero>
</template>

<script setup>
const { authenticated } = storeToRefs(useUserStore())
const { data, catalogCount } = await useHomeStatistics()

// The size of each catalog, leaving out any count that failed
const stats = computed(() =>
  [
    { label: 'Makers', value: catalogCount('makers') },
    { label: 'Colorways', value: catalogCount('colorways') },
    { label: 'Keysets', value: catalogCount('keysets') },
    { label: 'Keyboards', value: catalogCount('keyboards') },
  ].filter((stat) => stat.value),
)
</script>
