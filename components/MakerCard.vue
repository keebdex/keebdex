<template>
  <nuxt-link :to="`/artisan/maker/${maker.id}`">
    <UPageCard
      :title="maker.name"
      orientation="vertical"
      reverse
      spotlight
      :ui="{
        root: 'h-full',
        wrapper: 'items-center',
        // wrapper:
        //   'flex flex-grow items-center mx-auto p-6 aspect-square overflow-hidden',
      }"
    >
      <NuxtImg
        loading="lazy"
        :src="`/logo/${maker.id}.png`"
        :alt="maker.name"
        :class="{
          invert: maker.invertible_logo && $colorMode.value === 'dark',
        }"
      />
    </UPageCard>
  </nuxt-link>
</template>

<script setup>
defineProps({
  maker: {
    type: Object,
    default: () => ({}),
  },
})
</script>
