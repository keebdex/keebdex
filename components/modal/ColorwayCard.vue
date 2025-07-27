<template>
  <UPageCard
    :title="colorway.name"
    :description="colorway.description"
    :icon="
      Object.keys(specialSales).includes(colorway.sale_type) &&
      specialSales[colorway.sale_type]
    "
    reverse
    :ui="{
      footer: 'flex gap-2',
      leadingIcon:
        (colorway.sale_type === 'Auction' && 'text-warning') ||
        (colorway.sale_type === 'Commission' && 'text-success') ||
        (colorway.sale_type === 'Giveaway' && 'text-info'),
    }"
  >
    <NuxtImg :src="colorway.img" :alt="colorway.name" class="w-full" />

    <template #footer>
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
const emit = defineEmits(['editColorway', 'saveTo'])

const specialSales = {
  Auction: 'hugeicons:auction',
  Giveaway: 'hugeicons:wellness',
  Commission: 'hugeicons:save-money-dollar',
}

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
  card.classList.add('p-5')

  try {
    await copyScreenshot(card, toast)
  } catch (error) {
    toast.add({ color: 'error', title: error.message })
  }

  card.classList.remove('p-5')
  copying.value = false
}

const onSelectCollection = (collection, colorway) => {
  emit('saveTo', collection, colorway)
}
</script>
