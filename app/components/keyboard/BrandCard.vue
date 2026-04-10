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
    <div class="flex items-center p-6 aspect-square">
      <NuxtImg
        loading="lazy"
        :src="`/logo/${brand.slug}.png`"
        :alt="brand.name"
        class="mx-auto my-auto overflow-hidden"
        :class="{
          invert: brand.invertible_logo && $colorMode.value === 'dark',
        }"
      />
    </div>
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
