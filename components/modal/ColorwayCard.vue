<template>
  <Card
    class="!shadow-none colorway-details-card"
    pt:content:class="text-justify"
    pt:subtitle:class="flex items-center"
    pt:footer:class="flex gap-2"
  >
    <template #header>
      <img
        :alt="colorway.name"
        :src="colorway.img"
        class="h-full object-cover"
      />
    </template>
    <template #title>
      <div class="flex justify-between items-center">
        <div class="mt-0 font-semibold text-xl">
          {{ colorway.name }}
        </div>

        <Tag
          v-if="Object.keys(specialSales).includes(colorway.sale_type)"
          :icon="specialSales[colorway.sale_type]"
          :value="colorway.sale_type"
        />
      </div>
    </template>
    <template #subtitle>
      <template v-for="(extra, idx) in extras" :key="idx">
        <span class="flex items-center gap-1">
          <i :class="extra.icon" /> {{ extra.text }}
        </span>
        <Divider v-if="idx < extras.length - 1" layout="vertical" />
      </template>
    </template>
    <template #content>
      {{ colorway.description }}
    </template>

    <template v-if="!copying" #footer>
      <Button
        v-if="editable"
        size="small"
        severity="secondary"
        label="Edit"
        icon="pi pi-pen-to-square"
        fluid
        @click="$emit('editColorway', colorway, true)"
      />

      <Button
        size="small"
        severity="secondary"
        label="Copy Card"
        icon="pi pi-images"
        fluid
        @click="copyColorwayCard"
      />

      <SaveToCollection
        v-if="authenticated"
        :item="colorway"
        label="Save"
        :fluid="true"
        @on-select="onSelectCollection"
      />
    </template>
  </Card>
</template>

<script setup>
const emit = defineEmits(['editColorway', 'saveTo'])

const specialSales = {
  Auction: 'pi pi-hammer',
  Giveaway: 'pi pi-gift',
  Commission: 'pi pi-palette',
}

const { authenticated, colorway, editable } = defineProps({
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
    toast.add({ severity: 'error', summary: error.message, life: 3000 })
  }

  card.classList.remove('p-5')
  copying.value = false
}

const onSelectCollection = (collection, colorway) => {
  emit('saveTo', collection, colorway)
}
</script>
