<template>
  <!-- A maker, brand, or profile in a catalog list: its logo on a tile of a
       fixed shape, so logos of any size line up, then the name; pinned ones
       are marked with a pin -->
  <UPageCard
    :title="title"
    reverse
    spotlight
    :to="to"
    :ui="{
      root: 'h-full',
      container: imageCardContainerClass,
      title: 'truncate',
    }"
  >
    <div
      class="relative flex aspect-square items-center justify-center overflow-hidden rounded bg-elevated/50 p-5 sm:p-6"
    >
      <UIcon
        v-if="pinned"
        name="hugeicons:pin"
        class="absolute top-2 right-2 size-4 text-primary"
        aria-label="Pinned"
      />

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
  pinned: Boolean,
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
