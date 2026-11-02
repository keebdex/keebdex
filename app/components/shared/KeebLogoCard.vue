<template>
  <!-- A maker, brand, or profile in a catalog list: its logo on a tile of a
       fixed shape, so logos of any size line up, then the name and an
       optional line under it (a maker's country) -->
  <UPageCard
    :title="title"
    :description="description || undefined"
    reverse
    spotlight
    :to="to"
    :ui="{
      root: 'h-full',
      container: imageCardContainerClass,
      title: 'truncate',
      description: 'text-sm truncate',
    }"
  >
    <div
      class="flex items-center justify-center overflow-hidden rounded bg-elevated/50 p-5 sm:p-6"
      :class="aspect === 'video' ? 'aspect-video' : 'aspect-square'"
    >
      <NuxtImg
        loading="lazy"
        decoding="async"
        :src="imageSrc"
        :alt="title"
        class="max-h-full max-w-full object-contain"
        :class="{
          // `dark:` follows the `.dark` class, so SSR with a `system` color
          // mode still renders the right class instead of a hydration mismatch
          'dark:invert': invertible || imageSrc === fallbackSrc,
        }"
        @error="handleError"
      />
    </div>
  </UPageCard>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  to: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  invertible: {
    type: Boolean,
    default: false,
  },
  aspect: {
    type: String,
    default: 'square',
  },
})

const {
  public: { imgUrl },
} = useRuntimeConfig()

const logoSrc = computed(() => logoUrl(props.slug))
const fallbackSrc = `${imgUrl}/not-found.png`

const imageSrc = ref(logoSrc.value)

function handleError() {
  if (imageSrc.value === fallbackSrc) return

  imageSrc.value = fallbackSrc
}

watch(logoSrc, (value) => {
  imageSrc.value = value
})
</script>
