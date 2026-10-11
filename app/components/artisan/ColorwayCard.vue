<template>
  <UPageCard reverse class="mx-auto">
    <ArtisanYugiohCard
      v-if="cardType === 'yugioh'"
      ref="tradingCard"
      :colorway="colorway"
      :stars="classify.stars"
      :foil="!copying"
    />
    <ArtisanPokemonCard
      v-if="cardType === 'pokemon'"
      ref="tradingCard"
      :colorway="colorway"
      :stars="classify.stars"
      :foil="!copying"
    />

    <template #footer>
      <div class="flex items-center justify-center gap-2 w-full">
        <USelect
          v-model="cardType"
          :items="cardTypeOptions"
          class="mr-auto w-40"
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
import slugify from 'slugify'

const { colorway } = defineProps({
  colorway: {
    type: Object,
    default: () => ({}),
  },
})

const toast = useToast()

const cardType = ref('yugioh') // 'yugioh' | 'pokemon'
const cardTypeOptions = [
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
const tradingCard = useTemplateRef('tradingCard')

// The trading card has a fixed size, so it is captured in place, without the
// foil effect.
const capture = async () => {
  copying.value = true

  try {
    await nextTick()
    return await captureScreenshot(tradingCard.value.$el)
  } finally {
    copying.value = false
  }
}

// The capture promise goes straight into the clipboard write (Safari).
const copyImage = () => copyBlob(capture(), toast)

const downloadImage = async () => {
  try {
    const filename = slugify(colorwayTitle(colorway), { lower: true })
    downloadBlob(await capture(), filename)
  } catch (error) {
    toast.add(errorToast(error))
  }
}
</script>
