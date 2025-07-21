<template>
  <UPageCard variant="outline" :ui="{ container: 'divide-y divide-default' }">
    <UPageCard
      v-for="trade in trades"
      :key="trade.id"
      variant="naked"
      :title="trade.contact"
      :description="trade.message"
      :icon="
        trade.type === 'to_buy'
          ? 'hugeicons:money-bag-02'
          : 'hugeicons:sale-tag-02'
      "
      :ui="{
        leadingIcon: trade.type === 'to_buy' ? 'text-info' : 'text-warning',
      }"
      orientation="horizontal"
      class="flex items-center justify-between not-last:pb-4 gap-2"
    >
      <UAvatarGroup size="xl" :max="15">
        <UAvatar
          v-for="{ id, artisan } in trade.items"
          :key="id"
          :src="artisan.img"
          :alt="artisan.name"
        />
      </UAvatarGroup>
    </UPageCard>
  </UPageCard>
</template>

<script setup>
const marketplaceCfg = useState('marketplace-config', () => ({
  type: 'any',
}))

const { data, refresh } = await useAsyncData(() =>
  $fetch('/api/marketplace', {
    query: {
      maker_id: marketplaceCfg.value.maker_id,
      sculpt_name: marketplaceCfg.value.sculpt_name,
      colorway_id: marketplaceCfg.value.colorway_id,
    },
  }),
)

watch(marketplaceCfg, () => {
  refresh()
})

const trades = computed(() => {
  const { type } = marketplaceCfg.value
  return type === 'any' ? data.value : data.value.filter((i) => i.type === type)
})

// const chunkSize = 12
// const firstChunk = (items) => {
//   return items.length > chunkSize ? items.slice(0, chunkSize - 1) : items
// }

// const chunk = (array) => {
//   const chunkedArray = []
//   let index = 0

//   while (index < array.length) {
//     chunkedArray.push(array.slice(index, index + chunkSize))
//     index += chunkSize
//   }

//   return chunkedArray
// }
</script>
