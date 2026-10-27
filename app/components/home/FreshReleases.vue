<template>
  <UPageSection
    v-if="totalFreshReleases"
    :ui="{
      root: 'rounded-2xl border border-default bg-elevated/30',
      // A flex column: a grid track would stretch to the marquee's width.
      container: 'lg:flex !py-8 sm:!py-10 !gap-10 overflow-hidden',
    }"
  >
    <UPageHeader
      description="Fresh artisan drops from the last day and keysets open for orders."
      :ui="{
        root: 'py-0 border-none',
        title:
          'flex items-center gap-2.5 text-sm sm:text-sm font-semibold uppercase tracking-[0.24em] text-primary',
        description: 'mt-1.5 text-base',
      }"
    >
      <template #title>
        <span class="relative flex size-2">
          <span
            class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"
          />
          <span class="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Happening Now
      </template>
    </UPageHeader>

    <div v-if="artisanDrops.length" class="flex flex-col gap-4">
      <UPageHeader
        title="New from Makers"
        :links="[
          {
            label: 'Meet the Makers',
            to: '/artisan/maker',
            variant: 'link',
            trailingIcon: 'hugeicons:arrow-right-02',
            ui: { label: 'block' },
          },
        ]"
        :ui="sectionHeaderUi"
      />

      <HomeMarquee
        :items="artisanDrops"
        item-key="maker_id"
        :max="4"
        grid="sm:grid-cols-2 lg:grid-cols-4"
        item-class="w-60"
        duration="40s"
      >
        <template #default="{ item: maker }">
          <UPageCard
            :to="`/artisan/maker/${maker.maker_id}`"
            variant="subtle"
            spotlight
            class="h-full"
            :ui="{ container: 'py-3 px-4 sm:py-3 sm:px-4' }"
          >
            <template #body>
              <UUser
                size="lg"
                :avatar="{
                  src: `${imgUrl}/logo/${maker.maker_id}.png`,
                  alt: maker.name,
                  ui: {
                    root: 'rounded-none bg-transparent',
                    image: maker.invertible_logo && 'dark:invert',
                  },
                }"
                :name="maker.name"
                :description="
                  maker.additions === 1
                    ? '1 new colorway'
                    : `${maker.additions} new colorways`
                "
                :ui="{
                  root: 'min-w-0',
                  name: 'truncate',
                  description: 'truncate',
                }"
              />
            </template>
          </UPageCard>
        </template>
      </HomeMarquee>
    </div>

    <div v-if="liveKeysets.length" class="flex flex-col gap-4">
      <UPageHeader
        title="Live Group Buys"
        :links="[
          {
            label: 'Explore Keysets',
            to: '/keyset/group-buy?status=live',
            variant: 'link',
            trailingIcon: 'hugeicons:arrow-right-02',
            ui: { label: 'block' },
          },
        ]"
        :ui="sectionHeaderUi"
      />

      <HomeMarquee
        :items="liveKeysets"
        item-key="profile_keyset_id"
        :max="3"
        reverse
      >
        <template #default="{ item: keyset }">
          <UPageCard
            :to="`/keyset/${keyset.profile_keyset_id}`"
            variant="subtle"
            reverse
            spotlight
            class="h-full"
            :ui="{ container: 'p-3 sm:p-3 gap-3 sm:gap-3' }"
          >
            <div class="relative">
              <NuxtImg
                sizes="288px sm:400px"
                loading="lazy"
                decoding="async"
                :alt="`${keyset.profile.name} ${keyset.name}`"
                :src="keyset.img || '/keyset.png'"
                class="aspect-video w-full rounded-md object-cover"
              />
              <UBadge
                v-bind="closingBadge(keyset.end_date)"
                variant="solid"
                size="sm"
                class="absolute start-2 top-2"
              />
            </div>

            <template #body>
              <UUser
                :name="`${keyset.profile.name} ${keyset.name}`"
                :description="
                  formatDateRange(keyset.start_date, keyset.end_date) ||
                  'Live now'
                "
                :avatar="{
                  src: `${imgUrl}/logo/${keyset.profile_id}.png`,
                  alt: keyset.profile.name,
                  ui: {
                    root: 'rounded-none bg-transparent',
                    image: 'dark:invert',
                  },
                }"
                :ui="{ name: 'truncate', description: 'truncate' }"
              />
            </template>
          </UPageCard>
        </template>
      </HomeMarquee>
    </div>
  </UPageSection>
</template>

<script setup>
const empty = () => ({ makers: [], keysets: [] })

const { data } = await useAsyncData(
  'home-fresh-releases',
  () => $fetch('/api/statistics').catch(empty),
  { default: empty },
)

const {
  public: { imgUrl },
} = useRuntimeConfig()

const artisanDrops = computed(() => data.value?.makers || [])
const liveKeysets = computed(() => data.value?.keysets || [])

const totalFreshReleases = computed(
  () => artisanDrops.value.length + liveKeysets.value.length,
)

const sectionHeaderUi = {
  root: 'py-0 border-none',
  title: 'text-base sm:text-base font-semibold',
  links: 'mt-0',
  wrapper: 'flex-row items-center justify-between',
}

const DAY = 86_400_000

// "9 days left", counting the end date itself, in warning colors for the last
// three days. Live group buys always have an end date of today or later, and
// days are UTC dates, like the query that picks them (liveGroupBuys).
const closingBadge = (endDate) => {
  const days =
    Math.round((Date.parse(endDate) - Date.parse(isoToday())) / DAY) + 1

  return {
    label: days <= 1 ? 'Last day' : `${days} days left`,
    color: days <= 3 ? 'warning' : 'primary',
  }
}
</script>
