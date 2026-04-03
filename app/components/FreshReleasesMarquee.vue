<template>
  <UPageSection
    v-if="totalFreshReleases"
    :ui="{
      container:
        'rounded-2xl border border-default bg-elevated/30 p-3 sm:p-4 overflow-hidden !py-8 !gap-6',
    }"
  >
    <div class="mb-4 px-2 sm:px-3">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-dimmed">
        Happening now
      </p>
    </div>

    <div v-if="artisanDrops.length" class="space-y-3">
      <UUser
        :avatar="{
          icon: 'hugeicons:paint-board',
          ui: {
            root: 'bg-transparent',
            icon: 'text-primary',
          },
        }"
        name="Fresh artisan drops"
        description="Makers with new additions added today."
        size="xl"
      />

      <UMarquee
        pause-on-hover
        :repeat="$device.isMobile ? 2 : 4"
        class="py-3 max-w-(--ui-container)"
      >
        <UPageCard
          v-for="maker in artisanDrops"
          :key="maker.id"
          :to="`/artisan/maker/${maker.id}`"
          variant="subtle"
          spotlight
          class="mx-2 w-[260px] shrink-0 bg-elevated/60"
          :ui="{
            body: 'p-3',
          }"
        >
          <template #body>
            <UUser
              :name="maker.name"
              :description="formatMakerAdditions(maker.additions)"
              size="lg"
              :avatar="{
                src: `/logo/${maker.id}.png`,
                alt: maker.name,
                ui: {
                  root: 'rounded-none bg-transparent',
                  image:
                    maker.invertible_logo &&
                    $colorMode.value === 'dark' &&
                    'invert',
                },
              }"
            />
          </template>
        </UPageCard>
      </UMarquee>
    </div>

    <div v-if="liveKeycaps.length" class="mt-5 space-y-3">
      <UUser
        :avatar="{
          icon: 'hugeicons:live-streaming-01',
          ui: {
            root: 'bg-transparent',
            icon: 'text-primary',
          },
        }"
        name="Live keycap sets"
        description="Group buys and launches currently open."
        size="xl"
      />

      <UMarquee
        pause-on-hover
        reverse
        :repeat="$device.isMobile ? 2 : 4"
        class="py-3 max-w-(--ui-container)"
      >
        <UPageCard
          v-for="keycap in liveKeycaps"
          :key="keycap.profile_keycap_id"
          :to="`/keycap/${keycap.profile_keycap_id}`"
          variant="subtle"
          reverse
          spotlight
          class="mx-2 w-[300px] shrink-0 bg-elevated/60"
        >
          <NuxtImg
            loading="lazy"
            :alt="`${keycap.profile.name} ${keycap.name}`"
            :src="keycap.img || keycap.render_img"
            class="aspect-[16/9] w-full rounded-lg object-cover"
          />

          <template #footer>
            <UUser
              :name="`${keycap.profile.name} ${keycap.name}`"
              :description="
                formatDateRange(keycap.start_date, keycap.end_date) ||
                'Live now'
              "
              size="lg"
              :avatar="{
                src: `/logo/${keycap.profile_id}.png`,
                alt: keycap.profile.name,
                ui: {
                  root: 'rounded-none bg-transparent',
                  image:
                    keycap.profile.invertible_logo &&
                    $colorMode.value === 'dark' &&
                    'invert',
                },
              }"
            />
          </template>
        </UPageCard>
      </UMarquee>
    </div>
  </UPageSection>
</template>

<script setup>
const { data } = await useAsyncData(
  'home-fresh-releases',
  () =>
    $fetch('/api/statistics').catch(() => ({
      makers: [],
      keycaps: [],
    })),
  {
    default: () => ({
      makers: [],
      keycaps: [],
    }),
  },
)

const artisanDrops = computed(() => data.value?.makers || [])
const liveKeycaps = computed(() => data.value?.keycaps || [])

const totalFreshReleases = computed(
  () => artisanDrops.value.length + liveKeycaps.value.length,
)

const formatMakerAdditions = (count) => {
  return count === 1 ? '1 new addition' : `${count} new additions`
}
</script>
