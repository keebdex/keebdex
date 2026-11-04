<template>
  <UPageCard
    variant="subtle"
    reverse
    class="h-full cursor-pointer"
    :ui="{
      container: imageCardContainerClass,
      // The wrapper's items-start would size the body to a long name, so the
      // name could not truncate and pushed the badge out
      body: 'w-full min-w-0',
      title: 'flex w-full items-start justify-between gap-2',
      description: 'mt-1 flex flex-col gap-2',
    }"
  >
    <!-- A binder page of the first caps; the last cell counts the rest -->
    <div class="grid grid-cols-3 gap-1.5">
      <div
        v-for="(cell, index) in cells"
        :key="cell?.id ?? `empty-${index}`"
        class="relative aspect-square overflow-hidden rounded-md bg-elevated"
      >
        <NuxtImg
          v-if="cell?.artisan.img"
          :src="cell.artisan.img"
          :alt="cell.artisan.name"
          sizes="120px sm:160px"
          loading="lazy"
          decoding="async"
          class="size-full object-cover"
        />
        <span
          v-if="index === CELLS - 1 && more"
          class="absolute inset-0 flex items-center justify-center bg-default/75 font-mono text-lg font-semibold text-highlighted backdrop-blur-xs"
        >
          +{{ more }}
        </span>
      </div>
    </div>

    <template #title>
      <span class="min-w-0 truncate">{{ trade.name }}</span>
      <UBadge
        v-bind="TRADE_INTENTS[trade.intent]"
        variant="subtle"
        size="sm"
        class="shrink-0"
      />
    </template>

    <template #description>
      <p v-if="trade.message" class="line-clamp-2">{{ trade.message }}</p>
      <p
        class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted"
      >
        <span v-if="trade.contact" class="flex min-w-0 items-center gap-1">
          <UIcon name="simple-icons:discord" class="size-4 shrink-0" />
          <span class="truncate">{{ trade.contact }}</span>
        </span>
        <span class="flex items-center gap-1">
          <UIcon name="solar:box-bold-duotone" class="size-4" />
          {{ countLabel(trade.items.length, 'cap') }}
        </span>
        <span class="flex items-center gap-1">
          <UIcon name="solar:calendar-bold-duotone" class="size-4" />
          {{ formatDate(trade.created_at) }}
        </span>
      </p>
    </template>
  </UPageCard>
</template>

<script setup>
const { trade } = defineProps({
  // A Trading Hub listing: a collection with its listed items
  trade: {
    type: Object,
    required: true,
  },
})

const CELLS = 6


// Always six cells, so cards line up; fewer caps leave empty cells
const cells = computed(() =>
  Array.from({ length: CELLS }, (_, index) => trade.items[index]),
)

// Caps beyond the cells, counted on the last one, which they cover
const more = computed(() =>
  trade.items.length > CELLS ? trade.items.length - CELLS + 1 : 0,
)
</script>
