<template>
  <UPageCard
    reverse
    :ui="{
      root: ['w-(--card-width) shrink-0', !simple && 'h-(--card-height)'],
      container: simple
        ? imageCardContainerClass
        : 'h-full grid grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto]',
      title: 'text-lg',
    }"
  >
    <!-- The maker's logo is the avatar of the title (and the badges) -->
    <template #title>
      <div class="flex items-center gap-3">
        <UAvatar
          v-if="colorway.maker_id"
          :src="logoUrl(colorway.maker_id)"
          :alt="colorway.sculpt?.maker_name"
          :size="simple ? 'sm' : 'lg'"
          :ui="{
            root: 'shrink-0 bg-transparent',
            image: [
              'rounded-none object-contain',
              colorway.sculpt?.invertible_logo && 'dark:invert',
            ],
          }"
        />

        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <span :class="simple ? 'truncate' : 'line-clamp-2'">
            {{ colorwayTitle(colorway) }}
          </span>

          <div v-if="!simple && badges.length" class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="badge in badges"
              :key="badge.label"
              :label="badge.label"
              :icon="badge.icon"
              size="sm"
            />
          </div>
        </div>
      </div>
    </template>

    <template v-if="!simple && colorway.description" #description>
      <p class="line-clamp-3">
        {{ colorway.description }}
      </p>
    </template>

    <div
      :class="[
        simple ? 'aspect-square' : 'h-full',
        'overflow-hidden rounded bg-elevated flex items-center justify-center',
      ]"
    >
      <img
        v-if="colorway.img"
        :src="colorway.img"
        :alt="colorway.name"
        class="w-full h-full object-cover"
      >
      <UIcon v-else name="hugeicons:image-02" class="size-12 text-dimmed" />
    </div>

    <template #footer>
      <AppWordmark size="sm" domain class="ml-auto" />
    </template>
  </UPageCard>
</template>

<script setup>
// The Keebdex colorway card, styled by the active theme and sized like the
// trading cards so a copied image is the same on every screen. The detailed
// card's photo takes what its text leaves.
// The maker shows as its logo beside the title (`colorway.sculpt` holds
// `invertible_logo`).
const { colorway } = defineProps({
  colorway: {
    type: Object,
    default: () => ({}),
  },
  simple: {
    type: Boolean,
    default: false,
  },
})

const badges = computed(() =>
  [
    colorway.release && {
      label: colorway.release,
      icon: 'hugeicons:calendar-03',
    },
    colorway.sale_type && {
      label: colorway.sale_type,
      icon: 'hugeicons:tag-01',
    },
    colorway.price && {
      label: formatPrice(colorway.price, colorway.currency, {
        stripZeros: true,
      }),
      icon: 'hugeicons:money-03',
    },
    colorway.qty && {
      label: formatNumber(colorway.qty),
      icon: 'hugeicons:package',
    },
    colorway.stem?.length && {
      label: colorway.stem.join(', '),
      icon: 'hugeicons:keyboard',
    },
  ].filter(Boolean),
)
</script>
