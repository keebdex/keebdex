<template>
  <UPageCard
    :title="brand.name"
    orientation="vertical"
    reverse
    spotlight
    :to="`/keyboard/brand/${brand.slug}`"
    :ui="{
      root: 'h-full',
      wrapper: 'items-center',
    }"
  >
    <UAvatar
      :src="`/logo/${brand.slug}.png`"
      :alt="brand.name"
      size="7xl"
      :ui="{
        root: 'bg-transparent rounded-none p-6 aspect-video',
        image: 'h-full w-auto object-contain',
      }"
      :class="{
        invert: brand.invertible_logo && $colorMode.value === 'dark',
      }"
    >
      {{ brand.name }}
    </UAvatar>
  </UPageCard>
</template>

<script setup>
defineProps({
  brand: {
    type: Object,
    default: () => ({}),
  },
})
</script>
