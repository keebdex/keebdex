<template>
  <UPageCard
    :title="title"
    reverse
    :ui="{
      body: 'w-full',
      description: 'flex flex-col gap-4',
      leading: 'flex gap-2',
    }"
  >
    <div v-if="viewMode === 'single'" class="relative">
      <NuxtImg
        :src="
          showBack
            ? variant.img_back || variant.img_front || '/keyboard.png'
            : variant.img_front || variant.img_back || '/keyboard.png'
        "
        :alt="title + (showBack ? ' (Back)' : ' (Front)')"
        class="aspect-video w-full object-cover rounded"
      />
      <UButton
        v-if="variant.img_front && variant.img_back && !snapshot"
        size="xs"
        class="absolute top-2 right-2 z-10"
        icon="hugeicons:flip-horizontal"
        :label="showBack ? 'Show Front' : 'Show Back'"
        @click="showBack = !showBack"
      />
      <UButton
        v-if="variant.img_front && variant.img_back && !snapshot"
        size="xs"
        class="absolute top-2 left-2 z-10"
        icon="hugeicons:layout-grid"
        label="Side by Side"
        @click="viewMode = 'side'"
      />
    </div>
    <div v-else-if="viewMode === 'side'" class="flex gap-2">
      <div class="flex-1">
        <NuxtImg
          :src="variant.img_front || '/keyboard.png'"
          :alt="title + ' (Front)'"
          class="aspect-video w-full object-cover rounded"
        />
        <div class="text-xs text-center italic mt-2">Front</div>
      </div>
      <div class="flex-1">
        <NuxtImg
          :src="variant.img_back || '/keyboard.png'"
          :alt="title + ' (Back)'"
          class="aspect-video w-full object-cover rounded"
        />
        <div class="text-xs text-center italic mt-2">Back</div>
      </div>
      <UButton
        v-if="!snapshot"
        size="xs"
        class="absolute top-6 right-6 z-10"
        icon="hugeicons:border-all-02"
        label="Single View"
        @click="viewMode = 'single'"
      />
    </div>

    <template #description>
      <SharedSpecList :items="specs" layout="grid" :columns="3" />
    </template>

    <template #leading>
      <UBadge
        v-if="variant.sale_type === 'Auction'"
        label="Auction"
        icon="hugeicons:charity"
        color="warning"
      />
      <UBadge
        v-if="variant.sale_type === 'Giveaway'"
        label="Giveaway"
        icon="hugeicons:wellness"
        color="success"
      />
      <UBadge
        v-if="variant.sale_type === 'Commission'"
        label="Commission"
        icon="hugeicons:save-money-dollar"
        color="info"
      />
      <UBadge
        v-if="variant.photo_credit"
        :label="variant.photo_credit"
        icon="hugeicons:camera-add-02"
        color="info"
      />
    </template>

    <template v-if="!snapshot" #footer>
      <UButton icon="hugeicons:copy-02" @click="copyKeyboardCard">
        Copy
      </UButton>

      <SharedSaveToCollection
        v-if="authenticated"
        :item="{ ...variant, release_name: release.name }"
        category="keyboard"
        label="Save"
        @on-select="onSelectCollection"
      />
    </template>
    <template v-else #footer>
      <AppWordmark size="sm" />
    </template>
  </UPageCard>

  <!-- Copied image: the same card at a fixed width, in the current view. -->
  <SharedSnapshot v-if="!snapshot" ref="snapshotRef" width="48rem">
    <VariantCard
      :keyboard="keyboard"
      :release="release"
      :variant="variant"
      :view="{ viewMode, showBack }"
      snapshot
    />
  </SharedSnapshot>
</template>

<script setup>
const emit = defineEmits(['saveTo'])

const { keyboard, release, variant, authenticated, snapshot, view } = defineProps({
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
  // The off-screen copy used for the image: no buttons, a wordmark footer.
  snapshot: Boolean,
  // Initial `{ viewMode, showBack }`, so the image matches the visible card.
  view: {
    type: Object,
    default: undefined,
  },
})

const showBack = ref(view?.showBack ?? false)
// 'single' or 'side'
const viewMode = ref(view?.viewMode ?? 'single')

const title = computed(() => {
  return formatKeyboardDescription([
    keyboard.brand?.name,
    keyboard.name,
    release.name,
    variant.variant_name,
  ])
})

// The page shows the keyboard's own specs in its header, so the popup lists
// what this variant adds; the copied image stands alone and keeps them.
const specs = computed(() => {
  const keyboardSpecs = snapshot ? keyboardSpecItems(keyboard) : []

  return [
    {
      term: 'Release Year',
      description: variant.release_year || release.release_year,
      icon: 'hugeicons:calendar-03',
    },
    ...keyboardSpecs,
    {
      term: 'Finish',
      description: variant.finish_type,
      icon: 'hugeicons:paint-brush-01',
    },
    {
      term: 'Sale Type',
      description: variant.sale_type,
      icon: 'hugeicons:shopping-bag-01',
    },
    {
      term: 'Units Produced',
      description: variant.units_produced,
      icon: 'hugeicons:hashtag',
    },
    {
      term: 'Pricing',
      description: variantPrice(variant, release),
      icon: 'hugeicons:sale-tag-02',
    },
    // A variant's own materials replace the release's.
    ...KEYBOARD_MATERIAL_SPECS.map(({ term, field, icon }) => ({
      term,
      description: variantMaterials(variant, release, field),
      icon,
    })),
  ].filter((item) => item.description)
})

const toast = useToast()
const snapshotRef = useTemplateRef('snapshotRef')

// The capture promise goes straight into the clipboard write (Safari).
const copyKeyboardCard = () => copyBlob(snapshotRef.value.capture(), toast)

const onSelectCollection = (collection, item) => {
  emit('saveTo', collection, item)
}
</script>
