<template>
  <!-- How a variant was sold, when it was not a regular sale, and who took
       its photos -->
  <UBadge
    v-if="saleBadge"
    :label="variant.sale_type"
    :icon="saleBadge.icon"
    :color="saleBadge.color"
  />
  <UBadge
    v-if="variant.photo_credit"
    :label="variant.photo_credit"
    icon="hugeicons:camera-add-02"
    color="info"
  />
</template>

<script setup>
const { variant } = defineProps({
  variant: {
    type: Object,
    default: () => ({}),
  },
})

const SALE_BADGES = {
  Auction: { icon: 'hugeicons:charity', color: 'warning' },
  Giveaway: { icon: 'hugeicons:wellness', color: 'success' },
  Commission: { icon: 'hugeicons:save-money-dollar', color: 'info' },
}

const saleBadge = computed(() => SALE_BADGES[variant.sale_type])
</script>
