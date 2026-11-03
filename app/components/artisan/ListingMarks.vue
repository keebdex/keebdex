<template>
  <!-- What a wishlist or for-sale cap carries over its photo, the same on a
       collection page and in the Wishlist Image: a Found or Sold stamp once
       it is no longer listed, Top Priority (wishlists only), and the offer or
       asking price. The parent is the `relative` photo frame. -->
  <span
    v-if="!item.exchange"
    class="absolute inset-0 flex items-center justify-center"
  >
    <span
      class="-rotate-12 rounded-md border-2 bg-default/80 font-mono font-bold uppercase tracking-widest"
      :class="[
        buying ? 'border-success text-success' : 'border-error text-error',
        compact ? 'px-2 py-0.5 text-sm' : 'px-4 py-1 text-2xl',
      ]"
    >
      {{ buying ? 'Found' : 'Sold' }}
    </span>
  </span>

  <!-- Only the star on phones, beside the editor's actions -->
  <UBadge
    v-if="buying && item.priority"
    :label="compact ? undefined : 'Top Priority'"
    :aria-label="compact ? 'Top Priority' : undefined"
    icon="hugeicons:star"
    color="primary"
    variant="solid"
    :size="compact ? 'sm' : 'md'"
    class="absolute start-2 top-2"
  />

  <span
    v-if="item.exchange && item.asking_price"
    class="absolute bottom-2 end-2 flex items-baseline gap-1 rounded-md bg-default/90 font-mono ring ring-default"
    :class="compact ? 'px-1 py-px' : 'px-2 py-0.5'"
  >
    <span
      class="uppercase tracking-wider text-muted"
      :class="compact ? 'text-[9px]' : 'text-[10px]'"
    >
      {{ buying ? 'Offer' : 'Ask' }}
    </span>
    <span
      class="font-bold text-highlighted"
      :class="compact ? 'text-xs' : 'text-base'"
    >
      {{ item.asking_price }}
    </span>
  </span>
</template>

<script setup>
defineProps({
  // A collection item: `exchange` (still listed), `asking_price`, `priority`
  item: {
    type: Object,
    required: true,
  },
  // A wishlist; otherwise a for-sale-or-trade collection
  buying: Boolean,
  // Smaller text and badges for narrow grids
  compact: Boolean,
})
</script>
