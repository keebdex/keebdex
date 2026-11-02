<template>
  <!-- One variant in full: its release's story, its photos, and every spec
       (the keyboard's design, its release's, and its own). One drawer serves
       the whole keyboard page. -->
  <USlideover
    v-model:open="open"
    :title="title"
    :ui="{
      // Nuxt UI sets the width as sm:max-w-md, so override it at sm too
      content: 'sm:max-w-2xl',
      body: 'space-y-6',
      footer: 'flex flex-wrap gap-2',
    }"
  >
    <template #body>
      <!-- In the body, not the header, which stays fixed while the body
           scrolls -->
      <SharedDescription
        v-if="release.description"
        :description="release.description"
        class="text-sm text-muted"
      />

      <div class="space-y-3">
        <UTabs
          v-if="views.length > 1"
          v-model="view"
          :items="views"
          :content="false"
          size="xs"
          aria-label="Photo"
        />

        <div :class="photos.length > 1 && 'grid grid-cols-2 gap-2'">
          <figure v-for="photo in photos" :key="photo.label" class="space-y-1">
            <NuxtImg
              :src="photo.src"
              :alt="`${title} (${photo.label})`"
              class="aspect-video w-full object-cover rounded-lg border border-default"
            />
            <figcaption
              v-if="photos.length > 1"
              class="text-xs text-center text-muted"
            >
              {{ photo.label }}
            </figcaption>
          </figure>
        </div>

        <KeyboardVariantBadges :variant="variant" />
      </div>

      <section class="space-y-3">
        <UPageHeader
          title="Specifications"
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        />
        <SharedSpecList :items="specs" layout="grid" />
      </section>
    </template>

    <template #footer>
      <SharedSaveToCollection
        v-if="authenticated"
        :item="{ ...variant, release_name: release.name }"
        :item-name="variant.variant_name"
        category="keyboard"
        @on-select="(collection, item) => emit('saveTo', collection, item)"
      />

      <UButton
        icon="hugeicons:copy-02"
        label="Copy Image"
        :ui="{ label: 'block' }"
        @click="copyImage"
      />

      <!-- The copied image: the same variant at a fixed width, with the
           photos picked above -->
      <SharedSnapshot ref="snapshotRef" width="48rem">
        <KeyboardVariantCard
          :title="title"
          :photos="photos"
          :specs="specs"
          :variant="variant"
        />
      </SharedSnapshot>
    </template>
  </USlideover>
</template>

<script setup>
const emit = defineEmits(['saveTo'])

const open = defineModel('open', { type: Boolean, default: false })

const { keyboard, release, variant } = defineProps({
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
  authenticated: Boolean,
})

const title = computed(() => variantTitle(keyboard, release, variant))

// Front, back, or both side by side, when the variant has both photos
const view = ref('front')

const views = computed(() =>
  variant.img_front && variant.img_back
    ? [
        { label: 'Front', value: 'front' },
        { label: 'Back', value: 'back' },
        { label: 'Side by Side', value: 'side' },
      ]
    : [],
)

watch(
  () => variant.id,
  () => {
    view.value = 'front'
  },
)

const photos = computed(() => variantPhotos(variant, view.value))

const specs = computed(() => variantSpecItems(keyboard, release, variant))

const toast = useToast()
const snapshotRef = useTemplateRef('snapshotRef')

// The capture promise goes straight into the clipboard write (Safari).
const copyImage = () => copyBlob(snapshotRef.value.capture(), toast)
</script>
