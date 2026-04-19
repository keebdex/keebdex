<template>
  <UPageCard
    :title="title"
    reverse
    class="keyboard-details-card"
    :ui="{
      body: 'w-full',
      description: 'flex flex-col gap-4',
    }"
  >
    <NuxtImg
      :src="keyboard.img_front || keyboard.img_back || '/keyboard.png'"
      :alt="title"
      class="aspect-video w-full object-cover rounded"
    />

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
const emit = defineEmits(['saveTo'])

const { keyboard, authenticated } = defineProps({
  keyboard: {
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

const specs = computed(() => {
  return [
    {
      term: 'Release Year',
      description: keyboard.release_year
        ? String(keyboard.release_year)
        : undefined,
    },
    {
      term: 'Layout',
      description: keyboard.layout,
    },
    {
      term: 'Typing Angle',
      description: keyboard.typing_angle
        ? `${keyboard.typing_angle}°`
        : undefined,
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
