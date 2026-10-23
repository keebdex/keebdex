<template>
  <UMarquee
    v-if="items.length > max"
    pause-on-hover
    :reverse="reverse"
    :repeat="3"
    :ui="{ content: 'w-auto items-stretch' }"
    :style="{ '--duration': duration }"
    class="py-1 [--gap:--spacing(6)]"
  >
    <div
      v-for="(item, index) in items"
      :key="item[itemKey] ?? index"
      :class="['shrink-0', itemClass]"
    >
      <slot :item="item" />
    </div>
  </UMarquee>

  <!-- Under a centered heading, items center at their marquee width. -->
  <div
    v-else-if="layout === 'center'"
    class="flex flex-wrap justify-center gap-6"
  >
    <div
      v-for="(item, index) in items"
      :key="item[itemKey] ?? index"
      :class="['max-w-full', itemClass]"
    >
      <slot :item="item" />
    </div>
  </div>

  <div v-else :class="['grid gap-6', grid]">
    <template v-for="(item, index) in items" :key="item[itemKey] ?? index">
      <slot :item="item" />
    </template>
  </div>
</template>

<script setup lang="ts">
// A scrolling row only when the items overflow it; a few items repeated
// across a marquee read as duplicates, so up to `max` sit still in a grid.
withDefaults(
  defineProps<{
    items: Record<string, any>[]
    itemKey?: string
    /** Most items shown in the static grid. */
    max?: number
    /** Static layout: grid columns, or centered at the marquee width. */
    layout?: 'grid' | 'center'
    /** Grid columns for the static grid layout. */
    grid?: string
    /** Width of each item in the marquee. */
    itemClass?: string
    reverse?: boolean
    duration?: string
  }>(),
  {
    itemKey: 'id',
    max: 3,
    layout: 'grid',
    grid: 'sm:grid-cols-2 lg:grid-cols-3',
    itemClass: 'w-72',
    reverse: false,
    duration: '60s',
  },
)
</script>
