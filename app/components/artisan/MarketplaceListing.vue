<template>
  <div>
    <UPageList v-if="status === 'pending' && !trades.length" divide>
      <div
        v-for="index in 5"
        :key="index"
        class="flex flex-col lg:flex-row lg:items-center gap-4 py-4"
      >
        <div class="flex-1 space-y-2">
          <USkeleton class="h-5 w-48" />
          <USkeleton class="h-4 w-72 max-w-full" />
        </div>
        <div class="flex -space-x-2">
          <USkeleton
            v-for="avatar in 8"
            :key="avatar"
            class="size-10 rounded-full ring-2 ring-bg"
          />
        </div>
      </div>
    </UPageList>

    <UEmpty
      v-else-if="!trades.length"
      icon="hugeicons:store-01"
      title="No Listings Yet"
      :description="emptyDescription"
      :actions="[
        {
          label: 'Go to My Collection',
          icon: 'hugeicons:arrow-right-02',
          to: '/collection',
          ui: { label: 'block' },
        },
      ]"
    />

    <UPageList v-else divide>
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
          content: 'max-w-4xl',
        }"
      >
        <UPageCard
          variant="ghost"
          orientation="horizontal"
          :ui="{
            root: 'cursor-pointer',
            container: 'lg:items-center',
            description: 'mt-1 space-y-1',
          }"
        >
          <template #title>
            <span class="flex flex-wrap items-center gap-2">
              {{ trade.name }}
              <UBadge
                :label="isBuying(trade) ? 'Buying' : 'Selling'"
                :icon="intentIcon(trade)"
                :color="isBuying(trade) ? 'info' : 'warning'"
                variant="subtle"
                size="sm"
              />
            </span>
          </template>

          <template #description>
            <p v-if="trade.message" class="line-clamp-2">
              {{ trade.message }}
            </p>
            <p
              class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted"
            >
              <span v-if="trade.contact" class="flex items-center gap-1">
                <UIcon name="hugeicons:discord" class="size-4" />
                {{ trade.contact }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="hugeicons:package" class="size-4" />
                {{ countLabel(trade.items.length, 'cap') }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="hugeicons:calendar-03" class="size-4" />
                {{ formatDate(trade.created_at) }}
              </span>
            </p>
          </template>

          <UAvatarGroup size="xl" :max="avatarMax" class="lg:justify-end">
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
              :description="colorwayMaker(artisan)"
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
                  icon="hugeicons:star"
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
              icon="hugeicons:link-square-02"
              :to="`/collection/artisan/${trade.id}`"
              class="justify-center sm:flex-1"
              :ui="{ label: 'block' }"
            />
            <UButton
              v-if="trade.contact"
              :label="`Copy Discord: ${trade.contact}`"
              icon="hugeicons:discord"
              color="info"
              class="justify-center sm:flex-1"
              :ui="{ label: 'block truncate' }"
              @click="copyToClipboard(trade.contact)"
            />
          </div>
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
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

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

// As many avatars as fit on one row: below lg they span the full width,
// from lg they share the row with the collection details
const breakpoints = useBreakpoints(breakpointsTailwind)
const avatarMax = computed(() => {
  if (breakpoints['2xl'].value) return 14
  if (breakpoints.xl.value) return 10
  if (breakpoints.lg.value) return 7
  if (breakpoints.md.value) return 14
  if (breakpoints.sm.value) return 10
  return 7
})

const emptyDescription = computed(() => {
  if (intent === 'want') return 'Nobody is looking for caps right now.'
  if (intent === 'sell') return 'Nobody is selling caps right now.'
  return 'Share a Wishlist or For Sale or Trade collection to be the first.'
})

const isBuying = (trade) => trade.intent === 'want'

const intentIcon = (trade) =>
  isBuying(trade) ? 'hugeicons:money-bag-02' : 'hugeicons:sale-tag-02'

const colorwayMaker = (artisan) =>
  [artisan.sculpt?.name, artisan.maker?.name].filter(Boolean).join(' · ')

const copyToClipboard = (discord) => {
  navigator.clipboard.writeText(discord)
  toast.add(noticeToast('copied'))
}
</script>
