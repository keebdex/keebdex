<template>
  <!-- The variant as a fixed-width card for the copied image: the photos,
       title, and specs the drawer shows, and the wordmark. Rendered only
       inside the drawer's SharedSnapshot. -->
  <UPageCard
    :title="title"
    reverse
    :ui="{
      body: 'w-full',
      description: 'flex flex-col gap-4',
    }"
  >
    <div class="flex gap-2">
      <div v-for="photo in photos" :key="photo.label" class="flex-1">
        <NuxtImg
          :src="photo.src"
          :alt="`${title} (${photo.label})`"
          class="aspect-video w-full object-cover rounded"
        />
        <div v-if="photos.length > 1" class="text-xs text-center italic mt-2">
          {{ photo.label }}
        </div>
      </div>
    </div>

    <template #description>
      <SharedSpecList :items="specs" layout="grid" :columns="3" />
    </template>

    <template #leading>
      <KeyboardVariantBadges :variant="variant" />
    </template>

    <template #footer>
      <AppWordmark size="sm" />
    </template>
  </UPageCard>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  // `variantPhotos()` for the view picked in the drawer
  photos: {
    type: Array,
    required: true,
  },
  // `variantSpecItems()`
  specs: {
    type: Array,
    required: true,
  },
  variant: {
    type: Object,
    default: () => ({}),
  },
})
</script>
