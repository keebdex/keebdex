<template>
  <section
    class="grid items-center gap-10 py-4 sm:py-10 lg:grid-cols-2 lg:gap-16 lg:py-16"
  >
    <div class="flex min-w-0 flex-col items-start">
      <p
        class="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary"
      >
        The keyboard collector's index
      </p>

      <h1
        class="mt-4 text-4xl font-bold tracking-tight text-highlighted text-balance sm:text-5xl xl:text-6xl"
      >
        Every artisan, keyset, and keyboard, in
        <span class="text-primary">one dex</span>.
      </h1>

      <p class="mt-5 max-w-xl text-lg text-muted text-pretty sm:text-xl/8">
        {{ $config.public.site.description }}
      </p>

      <UDashboardSearchButton
        label="Search makers, colorways, keysets…"
        variant="outline"
        size="xl"
        class="mt-8 w-full max-w-lg"
        :ui="{ label: 'block truncate', trailing: 'ms-auto' }"
      />

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <!-- Guests land on the collection sign-in page. -->
        <UButton
          :label="authenticated ? 'My Collection' : 'Start Collecting'"
          to="/collection"
          icon="hugeicons:collections-bookmark"
          color="primary"
          size="lg"
          :ui="{ label: 'block' }"
        />
        <UButton
          label="Why Choose Keebdex?"
          to="/why-choose-keebdex"
          variant="link"
          size="lg"
          trailing-icon="hugeicons:arrow-right-02"
          :ui="{ label: 'block' }"
        />
      </div>

      <dl
        v-if="stats.length"
        class="mt-10 grid w-full grid-cols-2 gap-y-6 sm:grid-cols-4"
      >
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="flex flex-col-reverse gap-1 border-s border-default ps-4"
        >
          <dt class="text-sm text-muted">{{ stat.label }}</dt>
          <dd
            class="font-mono text-2xl font-semibold tabular-nums text-highlighted"
          >
            {{ stat.format(stat.value) }}
          </dd>
        </div>
      </dl>
    </div>

    <HomeKeycapMosaic v-if="data.showcase.length >= 8" :items="data.showcase" />
  </section>
</template>

<script setup>
const { authenticated } = storeToRefs(useUserStore())
const { data } = await useHomeStatistics()

// The size of each catalog, leaving out any count that failed
const stats = computed(() =>
  [
    { label: 'Makers', value: data.value.catalog.makers },
    {
      label: 'Colorways',
      value: data.value.catalog.colorways,
      format: formatEstimate,
    },
    { label: 'Keysets', value: data.value.catalog.keysets },
    { label: 'Keyboards', value: data.value.catalog.keyboards },
  ]
    .map((stat) => ({ format: formatNumber, ...stat }))
    .filter((stat) => stat.value),
)
</script>
