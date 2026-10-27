<template>
  <UPageCard reverse class="mx-auto">
    <ArtisanYugiohCard
      v-if="cardType === 'yugioh'"
      ref="card"
      :colorway="colorway"
      :stars="classify.stars"
      :foil="!copying"
    />
    <ArtisanPokemonCard
      v-else-if="cardType === 'pokemon'"
      ref="card"
      :colorway="colorway"
      :stars="classify.stars"
      :foil="!copying"
    />
    <ArtisanColorwayShareCard
      v-else
      ref="card"
      :colorway="colorway"
      :simple="cardType === 'simple'"
    />

    <template #footer>
      <!-- The select takes what is left, so the card sets the popup's width -->
      <div class="flex items-center gap-2 w-full">
        <USelect
          v-model="cardType"
          :items="cardTypeOptions"
          class="flex-1 w-0 min-w-0"
        />

        <UButton icon="hugeicons:copy-02" @click="copyImage"> Copy </UButton>

        <UButton icon="hugeicons:image-download-02" @click="downloadImage">
          Download
        </UButton>
      </div>
    </template>
  </UPageCard>
</template>

<script setup>

const { colorway } = defineProps({
  colorway: {
    type: Object,
    default: () => ({}),
  },
})

const toast = useToast()

const cardType = ref('simple') // 'simple' | 'detailed' | 'yugioh' | 'pokemon'
const cardTypeOptions = [
  { label: 'Keebdex Simple', value: 'simple' },
  { label: 'Keebdex Detailed', value: 'detailed' },
  { label: 'Yu-Gi-Oh!', value: 'yugioh' },
  { label: 'Pokémon', value: 'pokemon' },
]

const starTiers = [
  { min: 21, stars: 2, label: 'Very Easy' },
  { min: 16, stars: 3, label: 'Easy' },
  { min: 10, stars: 5, label: 'Normal' },
  { min: 5, stars: 7, label: 'Rare' },
  { min: 3, stars: 9, label: 'Very Rare' },
  { min: 0, stars: 12, label: 'Ultra Rare' },
]

function quantityToStars(qty) {
  return starTiers.find((t) => qty >= t.min)?.stars ?? null
}

const classify = computed(() => ({
  stars: quantityToStars(colorway.qty || 50),
}))

const copying = ref(false)

// The foil is hidden while copying, to ensure the screenshot is clear.
const card = useTemplateRef('card')

// Every card has a fixed size, so it is captured in place.
const capture = async () => {
  copying.value = true

  try {
    await nextTick()
    return await captureScreenshot(card.value.$el)
  } finally {
    copying.value = false
  }
}

// The capture promise goes straight into the clipboard write (Safari).
const copyImage = () => copyBlob(capture(), toast)

const downloadImage = async () => {
  try {
    const filename = urlSlugify(colorwayTitle(colorway))
    downloadBlob(await capture(), filename)
  } catch (error) {
    toast.add(errorToast(error))
  }
}
</script>
