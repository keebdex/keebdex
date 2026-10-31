<template>
  <!-- The variant as a fixed-width card for the copied image: one photo (or
       front and back side by side) in the view picked in the drawer, every
       spec, and the wordmark. Rendered only inside SharedSnapshot. -->
  <UPageCard
    :title="title"
    reverse
    :ui="{
      body: 'w-full',
      description: 'flex flex-col gap-4',
      leading: 'flex gap-2',
    }"
  >
    <div v-if="view === 'side'" class="flex gap-2">
      <div v-for="side in sides" :key="side.label" class="flex-1">
        <NuxtImg
          :src="side.src"
          :alt="`${title} (${side.label})`"
          class="aspect-video w-full object-cover rounded"
        />
        <div class="text-xs text-center italic mt-2">{{ side.label }}</div>
      </div>
    </div>
    <NuxtImg
      v-else
      :src="
        view === 'back'
          ? variant.img_back || variant.img_front || '/keyboard.png'
          : variant.img_front || variant.img_back || '/keyboard.png'
      "
      :alt="title"
      class="aspect-video w-full object-cover rounded"
    />

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
const { keyboard, release, variant, view } = defineProps({
  keyboard: {
    type: Object,
    default: () => ({}),
  },
  release: {
    type: Object,
    default: () => ({}),
  },
  variant: {
    type: Object,
    default: () => ({}),
  },
  // 'front', 'back', or 'side', as picked in the drawer
  view: {
    type: String,
    default: 'front',
  },
})

const title = computed(() =>
  formatKeyboardDescription([
    keyboard.brand?.name,
    keyboard.name,
    release.name,
    variant.variant_name,
  ]),
)

const sides = computed(() => [
  { label: 'Front', src: variant.img_front || '/keyboard.png' },
  { label: 'Back', src: variant.img_back || '/keyboard.png' },
])

// The image stands alone, so it carries the keyboard's specs too
const specs = computed(() => variantSpecItems(keyboard, release, variant))
</script>