<template>
  <UPageSection
    v-if="totalFreshReleases"
    :ui="{
      root: 'rounded-2xl border border-default bg-elevated/30 p-3 sm:p-4',
      container: '!py-8 !gap-6',
    }"
  >
    <UPageHeader
      title="Happening Now"
      :ui="{
        root: 'pb-4',
        title:
          'text-base sm:text-md font-semibold uppercase tracking-[0.24em] text-dimmed',
      }"
    />

    <div v-if="artisanDrops.length">
      <UPageHeader
        title="Artisan Makers with New Releases"
        :ui="{
          root: 'border-none py-4',
          title: 'text-sm sm:text-md text-muted',
        }"
        :links="[
          {
            label: 'Meet the Makers',
            to: '/artisan/maker',
            icon: 'solar:palette-bold-duotone',
            color: 'primary',
            variant: 'ghost',
            ui: { label: 'block' },
          },
        ]"
      />

      <UMarquee
        pause-on-hover
        :repeat="$device.isMobile ? 2 : 4"
        class="py-3 [--duration:28s] [--gap:--spacing(8)]"
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

    <div v-if="liveKeycaps.length">
      <UPageHeader
        title="Keycap Sets Open for Group Buys & Launches"
        :ui="{
          root: 'border-none py-4',
          title: 'text-sm sm:text-md text-muted',
        }"
        :links="[
          {
            label: 'Explore Keysets',
            to: '/keyset?status=live',
            icon: 'solar:layers-bold-duotone',
            color: 'primary',
            variant: 'ghost',
            ui: { label: 'block' },
          },
        ]"
      />

      <UMarquee
        pause-on-hover
        reverse
        :repeat="$device.isMobile ? 2 : 4"
        class="py-3 [--duration:28s] [--gap:--spacing(8)]"
      >
        <UPageCard
          v-for="keycap in liveKeycaps"
          :key="keycap.profile_keyset_id"
          :to="`/keyset/${keycap.profile_keyset_id}`"
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

          <template #body>
            <UUser
              :name="`${keycap.profile.name} ${keycap.name}`"
              :description="
                formatDateRange(keycap.start_date, keycap.end_date) ||
                'Live Now'
              "
              size="lg"
              :avatar="{
                src: `/logo/${keycap.profile_id}.png`,
                alt: keycap.profile.name,
                ui: {
                  root: 'rounded-none bg-transparent',
                  image: $colorMode.value === 'dark' && 'invert',
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
      keysets: [],
    })),
  {
    default: () => ({
      makers: [],
      keysets: [],
    }),
  },
)

const artisanDrops = computed(() => data.value?.makers || [])
const liveKeycaps = computed(() => data.value?.keysets || [])

const totalFreshReleases = computed(
  () => artisanDrops.value.length + liveKeycaps.value.length,
)

const formatMakerAdditions = (count) => {
  return count === 1 ? '1 new addition' : `${count} new additions`
}
</script>
