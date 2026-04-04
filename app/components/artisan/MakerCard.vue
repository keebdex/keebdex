<template>
  <UPageCard
    :title="maker.name"
    orientation="vertical"
    reverse
    spotlight
    :to="`/artisan/maker/${maker.id}`"
    :ui="{
      root: 'h-full',
      wrapper: 'items-center',
    }"
  >
    <UAvatar
      :src="`/logo/${maker.id}.png`"
      :alt="maker.name"
      size="7xl"
      :ui="{
        root: 'bg-transparent rounded-none p-6 aspect-square',
      }"
      :class="{
        invert: maker.invertible_logo && $colorMode.value === 'dark',
      }"
    >
      {{ maker.name }}
    </UAvatar>
  </UPageCard>
</template>

<script setup>
defineProps({
  maker: {
    type: Object,
    default: () => ({}),
  },
})
</script>
