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
        :description="slideoverDescription(trade)"
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
            <!-- Contacts are for signed-in collectors only; the API leaves
                 them out for everyone else -->
            <UButton
              v-if="!authenticated"
              label="Sign In to Contact"
              icon="solar:login-2-line-duotone"
              color="primary"
              class="justify-center sm:flex-1"
              :ui="{ label: 'block' }"
              @click="signInOpen = true"
            />
            <UButton
              v-else-if="trade.contact"
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

    <UModal v-model:open="signInOpen">
      <template #content>
        <UPageCard>
          <ModalLogin />
        </UPageCard>
      </template>
    </UModal>

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

const { authenticated } = storeToRefs(useUserStore())

// The sign-in modal for signed-out visitors who want to reach a collector
const signInOpen = ref(false)

const { page, size, setPage } = usePagination(20)

const { data, status } = await useAsyncData(
  // Signing in refetches, since contacts come only with a session
  () =>
    `marketplace-${intent}-${page.value}-${authenticated.value ? 'user' : 'guest'}`,
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

const slideoverDescription = (trade) => {
  const reach = authenticated.value
    ? 'Reach out on Discord'
    : 'Sign in to see their Discord and reach out'

  return isBuying(trade)
    ? `Caps this collector is looking for. ${reach} if you have one to sell or trade.`
    : `Caps available for sale or trade. ${reach} to make an offer.`
}

const copyToClipboard = (discord) => {
  navigator.clipboard.writeText(discord)
  toast.add(noticeToast('copied'))
}
</script>
