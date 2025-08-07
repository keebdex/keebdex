<template>
  <UPageCard
    :title="colorway.name"
    :description="colorway.description"
    reverse
    class="colorway-details-card"
  >
    <NuxtImg :src="colorway.img" :alt="colorway.name" class="w-full rounded" />

    <template #leading>
      <UBadge
        v-if="colorway.sale_type === 'Auction'"
        label="Auction"
        icon="hugeicons:auction"
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
    </template>
    <template v-if="!copying" #footer>
      <!-- This seems not working due to nested modal in Nuxt UI -->
      <!-- <UButton
        v-if="editable"
        icon="hugeicons:file-edit"
        @click="$emit('editColorway', colorway, true)"
      >
        Edit
      </UButton> -->

      <UButton icon="hugeicons:copy-02" @click="copyColorwayCard">
        Copy
      </UButton>

      <SaveToCollection
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
  editable: Boolean,
  authenticated: Boolean,
})

const extras = []
if (colorway.release) {
  extras.push({
    icon: 'pi pi-calendar',
    text: colorway.release,
  })
}
if (colorway.qty) {
  extras.push({
    icon: 'pi pi-hashtag',
    text: colorway.qty,
  })
}
if (colorway.price) {
  extras.push({
    icon: 'pi pi-money-bill',
    text: `${colorway.currency} ${colorway.price}`,
  })
}
if (colorway.stem) {
  extras.push({
    icon: 'pi pi-plus-circle',
    text: colorway?.stem.join(),
  })
}

const toast = useToast()

const copying = ref(false)
const copyColorwayCard = async () => {
  copying.value = true

  const card = document.getElementsByClassName('colorway-details-card')[0]

  try {
    await copyScreenshot(card, toast)
  } catch (error) {
    toast.add({ color: 'error', title: error.message })
  }

  copying.value = false
}

const onSelectCollection = (collection, colorway) => {
  emit('saveTo', collection, colorway)
}
</script>
