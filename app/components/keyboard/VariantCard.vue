<template>
  <UPageCard
    :title="title"
    reverse
    class="keyboard-details-card"
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
            ? keyboard.img_back || keyboard.img_front || '/keyboard.png'
            : keyboard.img_front || keyboard.img_back || '/keyboard.png'
        "
        :alt="title + (showBack ? ' (Back)' : ' (Front)')"
        class="aspect-video w-full object-cover rounded"
      />
      <UButton
        v-if="keyboard.img_front && keyboard.img_back && !copying"
        size="xs"
        class="absolute top-2 right-2 z-10"
        icon="hugeicons:flip-horizontal"
        :label="showBack ? 'Show Front' : 'Show Back'"
        @click="showBack = !showBack"
      />
      <UButton
        v-if="keyboard.img_front && keyboard.img_back && !copying"
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
          :src="keyboard.img_front || '/keyboard.png'"
          :alt="title + ' (Front)'"
          class="aspect-video w-full object-cover rounded"
        />
        <div class="text-xs text-center italic mt-2">Front</div>
      </div>
      <div class="flex-1">
        <NuxtImg
          :src="keyboard.img_back || '/keyboard.png'"
          :alt="title + ' (Back)'"
          class="aspect-video w-full object-cover rounded"
        />
        <div class="text-xs text-center italic mt-2">Back</div>
      </div>
      <UButton
        v-if="!copying"
        size="xs"
        class="absolute top-6 right-6 z-10"
        icon="hugeicons:border-all-02"
        label="Single View"
        @click="viewMode = 'single'"
      />
    </div>

    <template #description>
      <SharedDescriptionList
        :columns="$device.isMobile ? 1 : 3"
        :items="specs"
      />
    </template>

    <template #leading>
      <UBadge
        v-if="keyboard.sale_type === 'Auction'"
        label="Auction"
        icon="hugeicons:charity"
        color="warning"
      />
      <UBadge
        v-if="keyboard.sale_type === 'Giveaway'"
        label="Giveaway"
        icon="hugeicons:wellness"
        color="success"
      />
      <UBadge
        v-if="keyboard.sale_type === 'Commission'"
        label="Commission"
        icon="hugeicons:save-money-dollar"
        color="info"
      />
      <UBadge
        v-if="keyboard.photo_credit"
        :label="keyboard.photo_credit"
        icon="hugeicons:camera-add-02"
        color="info"
      />
    </template>

    <template v-if="!copying" #footer>
      <UButton icon="hugeicons:copy-02" @click="copyKeyboardCard">
        Copy
      </UButton>

      <SharedSaveToCollection
        v-if="authenticated"
        :item="keyboard"
        category="keyboard"
        label="Save"
        @on-select="onSelectCollection"
      />
    </template>
  </UPageCard>
</template>

<script setup>
const showBack = ref(false)
const viewMode = ref('single')
// 'single' or 'side'
const emit = defineEmits(['saveTo'])

const { keyboard, release, authenticated } = defineProps({
  keyboard: {
    type: Object,
    default: () => ({}),
  },
  release: {
    type: Object,
    default: () => ({}),
  },
  authenticated: Boolean,
})

const title = computed(() => {
  return formatKeyboardDescription([
    keyboard.keyboard_name,
    keyboard.release_name,
    keyboard.variant_name,
  ])
})

const formatPrice = (amount, currency = 'USD') => {
  if (!amount || isNaN(amount)) return null

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

const specs = computed(() => {
  const variantSpecs = release.variant_specs

  const price = keyboard.msrp_price
    ? formatPrice(keyboard.msrp_price, keyboard.currency)
    : formatPrice(release.msrp_price, release.currency)

  const caseMaterials = variantSpecs
    ? keyboard.case_materials
    : release.case_materials

  const pcbTypes = variantSpecs ? keyboard.pcb_types : release.pcb_types

  const plateMaterials = variantSpecs
    ? keyboard.plate_materials
    : release.plate_materials

  const weightMaterials = variantSpecs
    ? keyboard.weight_materials
    : release.weight_materials

  return [
    {
      term: 'Release Year',
      description: keyboard.release_year,
    },
    {
      term: 'Layout',
      description: keyboard.layout,
    },
    {
      term: 'Mount',
      description: release.mount_style,
    },
    {
      term: 'Typing Angle',
      description: keyboard.typing_angle ? `${keyboard.typing_angle}°` : null,
    },
    {
      term: 'Finish',
      description: keyboard.finish_type,
    },
    {
      term: 'Sale Type',
      description: keyboard.sale_type,
    },
    {
      term: 'Units Produced',
      description: keyboard.units_produced,
    },
    {
      term: 'Pricing',
      description: price,
    },
    {
      term: 'Case',
      description: caseMaterials?.length ? caseMaterials.join(', ') : null,
    },
    {
      term: 'PCB',
      description: pcbTypes?.length ? pcbTypes.join(', ') : null,
    },
    {
      term: 'Plate',
      description: plateMaterials?.length ? plateMaterials.join(', ') : null,
    },
    {
      term: 'Weight',
      description: weightMaterials?.length ? weightMaterials.join(', ') : null,
    },
  ]
})

const toast = useToast()
const copying = ref(false)

const copyKeyboardCard = async () => {
  copying.value = true

  const card = document.getElementsByClassName('keyboard-details-card')[0]

  try {
    await copyScreenshot(card, toast)
  } catch (error) {
    toast.add(handleError(error))
  }

  copying.value = false
}

const onSelectCollection = (collection, item) => {
  emit('saveTo', collection, item)
}
</script>
