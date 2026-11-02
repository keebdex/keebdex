<template>
  <UMarquee
    v-if="items.length > max"
    pause-on-hover
    :overlay="false"
    :reverse="reverse"
    :repeat="3"
    :ui="{ content: 'w-auto items-stretch' }"
    :style="{ '--duration': duration }"
    class="py-1 [--gap:--spacing(6)] mask-x-from-95%"
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
  <div v-else class="flex flex-wrap justify-center gap-6">
    <div
      v-for="(item, index) in items"
      :key="item[itemKey] ?? index"
      :class="['max-w-full', itemClass]"
    >
      <slot :item="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
// A scrolling row only when the items overflow it; a few items repeated
// across a marquee read as duplicates, so up to `max` sit still, centered.
// The edges fade through a mask rather than UMarquee's overlay, which sits
// above the cards and covers the one paused under the pointer.
withDefaults(
  defineProps<{
    items: Record<string, any>[]
    itemKey?: string
    /** Most items shown still. */
    max?: number
    /** Width of each item in the marquee. */
    itemClass?: string
    reverse?: boolean
    duration?: string
  }>(),
  {
    itemKey: 'id',
    max: 3,
    itemClass: 'w-72',
    reverse: false,
    duration: '60s',
  },
)
</script>
