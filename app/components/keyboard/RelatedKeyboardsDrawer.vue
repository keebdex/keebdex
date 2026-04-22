<template>
  <USlideover
    v-if="keyboards?.length"
    :title="title"
    :description="description"
  >
    <UButton :label="buttonLabel" :icon="icon" />

    <template #body>
      <UPageList class="flex gap-4">
        <UPageCard
          v-for="keyboard in keyboards"
          :key="keyboard.brand_keyboard_slug"
          :to="`/keyboard/brand/${keyboard.brand_keyboard_slug}`"
          :title="`${keyboard.brand?.name} ${keyboard.name}`"
          reverse
        >
          <NuxtImg
            loading="lazy"
            :alt="keyboard.name"
            :src="keyboard.cover_image || '/keyboard.png'"
            class="aspect-video w-full object-cover"
          />
        </UPageCard>
      </UPageList>
    </template>
  </USlideover>
</template>

<script setup>
defineProps({
  keyboards: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  buttonLabel: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'hugeicons:keyboard',
  },
})
</script>
