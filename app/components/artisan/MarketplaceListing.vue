<template>
  <div>
    <UPageGrid v-if="status === 'pending' && !trades.length">
      <div
        v-for="index in 6"
        :key="index"
        class="flex flex-col gap-4 rounded-lg p-4 ring ring-default"
      >
        <div class="grid grid-cols-3 gap-1.5">
          <USkeleton
            v-for="cell in 6"
            :key="cell"
            class="aspect-square rounded-md"
          />
        </div>
        <USkeleton class="h-5 w-48" />
        <USkeleton class="h-4 w-64 max-w-full" />
      </div>
    </UPageGrid>

    <UEmpty
      v-else-if="!trades.length"
      icon="solar:shop-bold-duotone"
      title="No Listings Yet"
      :description="emptyDescription"
      :actions="[
        {
          label: 'Go to My Collection',
          icon: 'solar:arrow-right-linear',
          to: '/collection',
          ui: { label: 'block' },
        },
      ]"
    />

    <UPageGrid v-else>
      <USlideover
        v-for="trade in trades"
        :key="trade.id"
        :title="trade.name"
        :description="
          isBuying(trade)
            ? 'Caps this collector is looking for. Reach out on Discord if you have one to sell or trade.'
            : 'Caps available for sale or trade. Reach out on Discord to make an offer.'
        "
        :ui="{
          // Nuxt UI sets the width as sm:max-w-md, so override it at sm too
          content: 'sm:max-w-4xl',
        }"
      >
        <ArtisanTradeCard :trade="trade" />

        <template #body>
          <div v-if="trade.message" class="text-muted whitespace-pre-line mb-4">
            {{ trade.message }}
          </div>

          <UPageGrid
            class="grid !grid-cols-2 md:!grid-cols-3 xl:!grid-cols-4 gap-4"
          >
            <UPageCard
              v-for="{ id, priority, asking_price, artisan } in trade.items"
              :key="id"
              :title="artisan.name"
              :description="colorwayCaption(artisan)"
              :to="`/artisan/maker/${artisan.maker_id}/${artisan.sculpt_id}?cid=${artisan.colorway_id}`"
              reverse
              :highlight="priority"
              :ui="{
                root: 'h-full flex flex-col',
                container: imageCardContainerClass,
              }"
              variant="soft"
            >
              <div class="relative aspect-square overflow-hidden">
                <NuxtImg
                  preset="square"
                  loading="lazy"
                  decoding="async"
                  :alt="artisan.name"
                  :src="artisan.img"
                  class="w-full h-full object-cover rounded"
                />
                <UBadge
                  v-if="priority"
                  label="Top Priority"
                  icon="solar:star-line-duotone"
                  color="primary"
                  size="sm"
                  class="absolute top-2 left-2"
                />
              </div>

              <template v-if="asking_price" #footer>
                <span class="flex items-baseline gap-1 text-sm">
                  <span class="text-muted">
                    {{ isBuying(trade) ? 'Offer' : 'Asking' }}
                  </span>
                  <span class="font-semibold text-highlighted">
                    {{ formatPrice(asking_price) }}
                  </span>
                </span>
              </template>
            </UPageCard>
          </UPageGrid>
        </template>

        <template #footer>
          <div class="flex flex-col sm:flex-row gap-2 w-full">
            <UButton
              label="View Collection"
              icon="solar:link-square-line-duotone"
              :to="`/collection/artisan/${trade.id}`"
              class="justify-center sm:flex-1"
              :ui="{ label: 'block' }"
            />
            <UButton
              v-if="trade.contact"
              :label="`Copy Discord: ${trade.contact}`"
              icon="simple-icons:discord"
              color="info"
              class="justify-center sm:flex-1"
              :ui="{ label: 'block truncate' }"
              @click="copyToClipboard(trade.contact)"
            />
          </div>
        </template>
      </USlideover>
    </UPageGrid>

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
const { intent } = defineProps({
  // 'want', 'sell', or 'all'
  intent: {
    type: String,
    default: 'all',
  },
})

const toast = useToast()

const { page, size, setPage } = usePagination(20)

const { data, status } = await useAsyncData(
  () => `marketplace-${intent}-${page.value}`,
  () =>
    $fetch('/api/marketplace', {
      query: {
        page: page.value,
        size,
        intent: intent === 'all' ? undefined : intent,
      },
    }),
)

const trades = computed(() => data.value?.data || [])
const total = computed(() => data.value?.total || 0)

const emptyDescription = computed(() => {
  if (intent === 'want') return 'Nobody is looking for caps right now.'
  if (intent === 'sell') return 'Nobody is selling caps right now.'
  return 'Share a Wishlist or For Sale or Trade collection to be the first.'
})

const isBuying = (trade) => trade.intent === 'want'

const copyToClipboard = (discord) => {
  navigator.clipboard.writeText(discord)
  toast.add(noticeToast('copied'))
}
</script>
