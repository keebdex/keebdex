<template>
  <UPageList divide>
    <USlideover
      v-for="trade in trades"
      :key="trade.id"
      title="Trade Inventory"
      description="All items listed are available and ready for your trade proposal."
    >
      <UPageCard
        variant="ghost"
        :title="trade.contact"
        :description="trade.message"
        :icon="
          trade.intent === 'want'
            ? 'hugeicons:money-bag-02'
            : 'hugeicons:sale-tag-02'
        "
        :ui="{
          root: 'cursor-pointer',
          leadingIcon: trade.intent === 'want' ? 'text-info' : 'text-warning',
        }"
        orientation="horizontal"
        class="flex items-center justify-between not-last:pb-4 gap-2"
      >
        <UAvatarGroup size="xl" :max="15">
          <UTooltip
            v-for="{ id, artisan } in trade.items"
            :key="id"
            :delay-duration="0"
            :text="colorwayTitle(artisan)"
          >
            <UAvatar :src="artisan.img" :alt="artisan.name" />
          </UTooltip>
        </UAvatarGroup>
      </UPageCard>

      <template #body>
        <UPageHeader
          :headline="trade.intent === 'want' ? 'Buying' : 'Selling'"
          :title="trade.contact"
          :description="trade.message"
        />

        <UPageGrid class="grid !grid-cols-2 gap-4 mt-4">
          <UPageCard
            v-for="{ id, priority, artisan } in trade.items"
            :key="id"
            :title="artisan.name"
            :description="artisan?.sculpt.name"
            orientation="vertical"
            reverse
            :highlight="!!priority"
            :ui="{
              root: 'h-full',
              wrapper: 'flex-1',
            }"
            variant="soft"
          >
            <div class="aspect-square overflow-hidden">
              <NuxtImg
                loading="lazy"
                :alt="artisan.name"
                :src="artisan.img"
                class="w-full h-full object-cover rounded"
              />
            </div>
          </UPageCard>
        </UPageGrid>
      </template>

      <template #footer>
        <UButton
          block
          label="Copy Discord"
          icon="hugeicons:discord"
          color="info"
          @click="copyToClipboard(trade.contact)"
        />
      </template>
    </USlideover>
  </UPageList>
</template>

<script setup>
const toast = useToast()

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

const copyToClipboard = (discord) => {
  navigator.clipboard.writeText(discord)
  toast.add({
    color: 'success',
    title: 'Copied to clipboard!',
  })
}
</script>
