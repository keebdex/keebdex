<template>
  <div>
    <UPageList divide>
      <USlideover
        v-for="trade in trades"
        :key="trade.id"
        title="Trade Inventory"
        description="All items listed are available and ready for your trade proposal."
        :ui="{
          content: 'max-w-4xl',
        }"
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

          <UPageGrid
            class="grid !grid-cols-2 md:!grid-cols-3 xl:!grid-cols-4 gap-4 mt-4"
          >
            <UPageCard
              v-for="{ id, priority, artisan } in trade.items"
              :key="id"
              :title="artisan.name"
              :description="artisan?.sculpt.name"
              reverse
              :highlight="!!priority"
              :ui="{
                root: 'h-full flex flex-col',
                container: imageCardContainerClass,
              }"
              variant="soft"
            >
              <div class="aspect-square overflow-hidden">
                <NuxtImg
                  preset="square"
                  loading="lazy"
                  decoding="async"
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

    <UPagination
      v-if="total > size"
      :page="page"
      :items-per-page="size"
      :total="total"
      class="border-t border-default pt-4 mt-6"
      :ui="{
        list: 'justify-center',
      }"
      @update:page="setPage"
    />
  </div>
</template>

<script setup>
const toast = useToast()

const { page, size, setPage } = usePagination(20)

const { data } = await useAsyncData(
  () => `marketplace-${page.value}`,
  () =>
    $fetch('/api/marketplace', {
      query: { page: page.value, size },
    }),
)

const trades = computed(() => data.value?.data || [])
const total = computed(() => data.value?.total || 0)

const copyToClipboard = (discord) => {
  navigator.clipboard.writeText(discord)
  toast.add(noticeToast('copied'))
}
</script>
