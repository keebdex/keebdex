<template>
  <!-- How a variant was sold, when it was not a regular sale, and who took
       its photos -->
  <div v-if="saleBadge || variant.photo_credit" class="flex flex-wrap gap-2">
    <UBadge
      v-if="saleBadge"
      :label="variant.sale_type"
      :icon="saleBadge.icon"
      :color="saleBadge.color"
    />
    <UBadge
      v-if="variant.photo_credit"
      :label="variant.photo_credit"
      icon="solar:camera-add-bold-duotone"
      color="info"
    />
  </div>
</template>

<script setup>
const { variant } = defineProps({
  variant: {
    type: Object,
    default: () => ({}),
  },
})

const SALE_BADGES = {
  Auction: { icon: 'solar:hand-heart-bold-duotone', color: 'warning' },
  Giveaway: { icon: 'solar:heart-pulse-bold-duotone', color: 'success' },
  Commission: { icon: 'solar:wallet-money-bold-duotone', color: 'info' },
}

const saleBadge = computed(() => SALE_BADGES[variant.sale_type])
</script>
