<template>
  <UPageCard reverse class="mx-auto">
    <ArtisanYugiohCard
      v-if="cardType === 'yugioh'"
      :colorway="colorway"
      :stars="classify.stars"
      :rarity="classify.rarity"
      class="artisan-trading-card"
    />
    <ArtisanPokemonCard
      v-if="cardType === 'pokemon'"
      :colorway="colorway"
      :stars="classify.stars"
      :rarity="classify.rarity"
      class="artisan-trading-card"
    />

    <template v-if="!copying" #footer>
      <div class="flex items-center justify-center gap-2 w-full">
        <USelect
          v-model="cardType"
          :items="cardTypeOptions"
          class="mr-auto w-40"
        />

        <UButton icon="hugeicons:copy-02" @click="screenshot()"> Copy </UButton>

        <UButton icon="hugeicons:image-download-02" @click="screenshot(true)">
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

const { isDesktop } = useDevice()
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

const rarityTiers = [
  { min: 15, rarity: '', label: 'Normal' },
  { min: 6, rarity: 'holo-active', label: 'Holographic Foil' },
  { min: 0, rarity: 'secret-rare-active', label: 'Secret Rare' },
]

function quantityToStars(qty) {
  return starTiers.find((t) => qty >= t.min)?.stars ?? null
}

function quantityToRarity(qty) {
  return rarityTiers.find((t) => qty >= t.min)?.rarity ?? null
}

const classify = computed(() => {
  const qty = colorway.qty || 50
  return {
    stars: quantityToStars(qty),
    rarity: quantityToRarity(qty),
  }
})

const copying = ref(false)
const screenshot = async (download = false) => {
  copying.value = true

  // wait a sec to hide footer
  await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })

  const card = document.getElementsByClassName('artisan-trading-card')[0]

  // remove 'flex-1' class to eliminate unnecessary spacing
  card.classList.remove('flex-1')

  try {
    if (download) {
      await downloadScreenshot(card, toast)
    } else {
      await copyScreenshot(card, toast, !isDesktop)
    }
  } catch (error) {
    toast.add(handleError(error))
  }

  card.classList.add('flex-1')

  copying.value = false
}
</script>
