<template>
  <section v-if="drops.length || keysets.length" class="flex flex-col gap-8">
    <HomeSectionHeader
      title="Happening Now"
      description="Fresh artisan drops from the last day and group buys open for orders."
    >
      <template #headline>
        <span class="relative flex size-2">
          <span
            class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"
          />
          <span class="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Live
      </template>
    </HomeSectionHeader>

    <!-- Makers take a column and group buys two; either alone takes the row -->
    <div
      :class="['grid gap-6', drops.length && keysets.length && 'lg:grid-cols-3']"
    >
      <UCard
        v-if="drops.length"
        variant="subtle"
        :ui="cardUi"
      >
        <template #header>
          <h3 class="font-semibold text-highlighted">New from Makers</h3>
          <UButton
            label="All Makers"
            to="/artisan/maker"
            variant="link"
            size="sm"
            trailing-icon="hugeicons:arrow-right-02"
            :ui="{ label: 'block' }"
          />
        </template>

        <ul class="divide-y divide-default">
          <li v-for="maker in drops" :key="maker.maker_id">
            <ULink
              :to="`/artisan/maker/${maker.maker_id}`"
              :class="[rowClass, 'gap-3']"
            >
              <UUser
                :avatar="{
                  src: logoUrl(maker.maker_id),
                  alt: maker.name,
                  ui: {
                    root: 'rounded-none bg-transparent',
                    image: maker.invertible_logo && 'dark:invert',
                  },
                }"
                :name="maker.name"
                :ui="{ root: 'min-w-0 flex-1', name: 'truncate' }"
              />
              <UBadge
                :label="`+${maker.additions}`"
                color="primary"
                variant="soft"
                class="font-mono tabular-nums"
              />
            </ULink>
          </li>
        </ul>
      </UCard>

      <UCard
        v-if="keysets.length"
        variant="subtle"
        :class="drops.length && 'lg:col-span-2'"
        :ui="cardUi"
      >
        <template #header>
          <h3 class="font-semibold text-highlighted">Closing Soon</h3>
          <UButton
            :label="`All ${data.liveCount} Live`"
            to="/keyset/group-buy?status=live"
            variant="link"
            size="sm"
            trailing-icon="hugeicons:arrow-right-02"
            :ui="{ label: 'block' }"
          />
        </template>

        <ul class="divide-y divide-default">
          <li v-for="keyset in keysets" :key="keyset.profile_keyset_id">
            <ULink
              :to="`/keyset/${keyset.profile_keyset_id}`"
              :class="[rowClass, 'gap-4']"
            >
              <NuxtImg
                :src="keyset.img || '/keyset.png'"
                :alt="`${keyset.profile.name} ${keyset.name}`"
                sizes="96px sm:128px"
                loading="lazy"
                decoding="async"
                class="aspect-video w-24 shrink-0 rounded-md bg-elevated object-cover sm:w-32"
              />

              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate font-medium text-highlighted">
                      {{ keyset.profile.name }} {{ keyset.name }}
                    </p>
                    <p class="truncate text-sm text-muted">
                      {{ formatDateRange(keyset.start_date, keyset.end_date) }}
                    </p>
                  </div>
                  <UBadge
                    :label="keyset.closing.label"
                    :color="keyset.closing.color"
                    size="sm"
                    class="shrink-0"
                  />
                </div>

                <UProgress
                  :model-value="keyset.closing.elapsed"
                  :color="keyset.closing.color"
                  size="xs"
                  :aria-label="`${keyset.closing.elapsed}% of the group buy has passed`"
                />
              </div>
            </ULink>
          </li>
        </ul>
      </UCard>
    </div>
  </section>
</template>

<script setup>
const { data } = await useHomeStatistics()

// The server sends the busiest makers (about as many rows as fill the height
// of the group buys beside them) and the group buys closing first
const drops = computed(() => data.value.makers)
const keysets = computed(() =>
  data.value.keysets.map((keyset) => ({
    ...keyset,
    closing: groupBuyCountdown(keyset),
  })),
)

// Both lists share one card look, with a row per item
const cardUi = {
  header: 'flex items-center justify-between gap-2',
  body: 'p-0 sm:p-0',
}
const rowClass =
  'flex items-center px-4 py-3 transition-colors hover:bg-elevated/60 sm:px-6'
</script>
