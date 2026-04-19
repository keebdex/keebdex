<template>
  <UPageCard
    :title="colorwayTitle(colorway)"
    reverse
    class="colorway-details-card"
    :ui="{
      body: 'w-full',
      description: 'flex flex-col gap-4',
    }"
  >
    <NuxtImg
      :src="colorway.img"
      :alt="colorwayTitle(colorway)"
      class="w-full rounded"
    />

    <template #description>
      <SharedDescription
        v-if="colorway.description"
        :description="colorway.description"
      />

      <SharedDescriptionList
        :columns="2"
        :items="
          [
            { term: 'Release', description: colorway.release },
            {
              term: 'Price',
              description: colorway.price
                ? `${colorway.currency} ${colorway.price}`
                : undefined,
            },
            { term: 'Quantity', description: colorway.qty },
            {
              term: 'Stem',
              description: Array.isArray(colorway.stem)
                ? colorway.stem.join(', ')
                : undefined,
            },
          ].filter((i) => i.description)
        "
      />
    </template>

    <template #leading>
      <UBadge
        v-if="colorway.sale_type === 'Auction'"
        label="Auction"
        icon="hugeicons:charity"
        color="warning"
      />
      <UBadge
        v-if="colorway.sale_type === 'Giveaway'"
        label="Giveaway"
        icon="hugeicons:wellness"
        color="success"
      />
      <UBadge
        v-if="colorway.sale_type === 'Commission'"
        label="Commission"
        icon="hugeicons:save-money-dollar"
        color="info"
      />
      <UBadge
        v-if="colorway.photo_credit"
        :label="`${colorway.photo_credit}`"
        icon="hugeicons:camera-add-02"
        color="info"
      />
    </template>

    <template v-if="!copying" #footer>
      <UButton icon="hugeicons:copy-02" @click="copyColorwayCard">
        Copy
      </UButton>

      <SharedSaveToCollection
        v-if="authenticated"
        :item="colorway"
        label="Save"
        @on-select="onSelectCollection"
      />
    </template>
  </UPageCard>
</template>

<script setup>
const emit = defineEmits(['saveTo'])

const { authenticated, colorway } = defineProps({
  colorway: {
    type: Object,
    default: () => ({}),
  },
  authenticated: Boolean,
})

const toast = useToast()

const copying = ref(false)
const copyColorwayCard = async () => {
  copying.value = true

  const card = document.getElementsByClassName('colorway-details-card')[0]

  try {
    await copyScreenshot(card, toast)
  } catch (error) {
    toast.add(handleError(error))
  }

  copying.value = false
}

const onSelectCollection = (collection, colorway) => {
  emit('saveTo', collection, colorway)
}
</script>
