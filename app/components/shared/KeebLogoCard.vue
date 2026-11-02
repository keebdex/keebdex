<template>
  <!-- A maker, brand, or profile in a catalog list: its logo on a tile of a
       fixed shape, so logos of any size line up, then the name; pinned ones
       get a pin beside the name, clear of the logo. Without `to` the card
       is not a link, and its `footer` holds links of its own (a
       manufacturer's profiles). -->
  <UPageCard
    :title="title"
    reverse
    spotlight
    :to="to"
    :ui="{
      root: 'h-full',
      container: imageCardContainerClass,
      // Full width, so the pin sits at the end of the name's row
      body: 'w-full',
    }"
  >
    <template #title>
      <div class="flex items-center justify-between gap-2">
        <span class="truncate">{{ title }}</span>
        <UIcon
          v-if="pinned"
          :name="PINNED_ICON"
          class="size-4 shrink-0 text-primary"
          aria-label="Pinned"
        />
      </div>
    </template>

    <div
      class="flex aspect-square items-center justify-center overflow-hidden rounded bg-elevated/50 p-5 sm:p-6"
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

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
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
