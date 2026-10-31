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

        <div v-if="view === 'side'" class="grid grid-cols-2 gap-2">
          <figure v-for="side in sides" :key="side.label" class="space-y-1">
            <NuxtImg
              :src="side.src"
              :alt="`${title} (${side.label})`"
              class="aspect-video w-full object-cover rounded-lg border border-default"
            />
            <figcaption class="text-xs text-center text-muted">
              {{ side.label }}
            </figcaption>
          </figure>
        </div>
        <NuxtImg
          v-else
          :src="photo"
          :alt="title"
          class="aspect-video w-full object-cover rounded-lg border border-default"
        />

        <div v-if="variant.sale_type || variant.photo_credit" class="flex flex-wrap gap-2">
          <KeyboardVariantBadges :variant="variant" />
        </div>
      </div>

      <section class="space-y-3">
        <UPageHeader
          title="Specifications"
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        />
        <SharedSpecList :items="specs" layout="grid" :columns="3" />
      </section>
    </template>

    <template #footer>
      <SharedSaveToCollection
        v-if="authenticated"
        :item="{ ...variant, release_name: release.name }"
        :item-name="variant.variant_name"
        category="keyboard"
        label="Save"
        keep-label
        @on-select="(collection, item) => emit('saveTo', collection, item)"
      />

      <UButton
        icon="hugeicons:copy-02"
        label="Copy Image"
        :ui="{ label: 'block' }"
        @click="copyImage"
      />

      <!-- The copied image: the same variant at a fixed width, in the view
           picked above -->
      <SharedSnapshot ref="snapshotRef" width="48rem">
        <KeyboardVariantCard
          :keyboard="keyboard"
          :release="release"
          :variant="variant"
          :view="view"
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

const title = computed(() =>
  formatKeyboardDescription([
    keyboard.brand?.name,
    keyboard.name,
    release.name,
    variant.variant_name,
  ]),
)

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

const photo = computed(() =>
  view.value === 'back'
    ? variant.img_back || variant.img_front || '/keyboard.png'
    : variant.img_front || variant.img_back || '/keyboard.png',
)

const sides = computed(() => [
  { label: 'Front', src: variant.img_front },
  { label: 'Back', src: variant.img_back },
])

const specs = computed(() => variantSpecItems(keyboard, release, variant))

const toast = useToast()
const snapshotRef = useTemplateRef('snapshotRef')

// The capture promise goes straight into the clipboard write (Safari).
const copyImage = () => copyBlob(snapshotRef.value.capture(), toast)
</script>
