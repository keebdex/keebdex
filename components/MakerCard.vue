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
    <div class="flex items-center p-6 aspect-square">
      <NuxtImg
        loading="lazy"
        :src="`/logo/${maker.id}.png`"
        :alt="maker.name"
        class="mx-auto my-auto overflow-hidden"
        :class="{
          invert: maker.invertible_logo && $colorMode.value === 'dark',
        }"
      />
    </div>
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
