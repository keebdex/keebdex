<template>
  <UPageCard
    :title="sculpt.name"
    :description="sculpt.collection"
    orientation="vertical"
    reverse
    spotlight
    :to="`/artisan/maker/${sculpt.maker_id}/${sculpt.sculpt_id}`"
    :ui="{
      root: 'h-full',
      wrapper: 'flex-1',
    }"
  >
    <div class="aspect-square overflow-hidden">
      <NuxtImg
        loading="lazy"
        :alt="sculpt.name"
        :src="sculpt.img"
        class="w-full h-full object-cover rounded"
      />
    </div>
  </UPageCard>
</template>

<script setup>
defineProps({
  sculpt: {
    type: Object,
    default: () => ({}),
  },
  favorite: Boolean,
})
</script>
