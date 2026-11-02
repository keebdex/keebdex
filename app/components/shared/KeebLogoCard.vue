<template>
  <!-- A maker, brand, or profile in a catalog list: its logo on a tile of a
       fixed shape, so logos of any size line up, then the name. Without `to`
       it is not a link (a manufacturer with several profiles opens a picker
       instead). -->
  <UPageCard
    :title="title"
    reverse
    spotlight
    :to="to"
    :ui="{
      root: 'h-full',
      container: imageCardContainerClass,
      body: 'w-full',
      title: 'truncate',
    }"
  >
    <!-- The padding scales with the tile, so a wide grid cell still leaves
         the logo room around it -->
    <div
      class="flex aspect-square items-center justify-center overflow-hidden rounded bg-elevated/50 p-[14%]"
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
  to: {
    type: String,
    default: undefined,
  },
  slug: {
    type: String,
    required: true,
  },
  invertible: {
    type: Boolean,
    default: false,
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
