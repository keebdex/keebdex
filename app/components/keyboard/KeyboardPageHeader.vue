<template>
  <UPageHeader :title="keyboard.name">
    <template v-if="keyboard.description" #description>
      <SharedPageHeaderDescription :description="keyboard.description" />
    </template>
  </UPageHeader>
</template>

<script setup>
defineProps({
  brand: {
    type: Object,
    default: () => ({}),
  },
  keyboard: {
    type: Object,
    default: () => ({}),
  },
  releases: {
    type: Array,
    default: () => [],
  },
  totalVariants: {
    type: Number,
    default: 0,
  },
})
</script>
