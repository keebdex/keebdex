<template>
  <UDashboardPanel id="marketplace">
    <template #header>
      <UDashboardNavbar title="Trading Hub" />

      <UDashboardToolbar>
        <template #left>
          <UTabs
            v-model="intent"
            :items="intentItems"
            :content="false"
            size="xs"
            aria-label="Show"
          />
        </template>

        <template #right>
          <!-- How a collection gets here, in the order it happens; a guide
          rather than a wizard, so every step shows as done -->
          <UPopover :content="{ align: 'end' }">
            <UButton
              label="How to List Your Caps"
              aria-label="How to list your caps"
              icon="solar:info-circle-line-duotone"
              variant="ghost"
              size="sm"
            />

            <template #content>
              <div class="w-80 max-w-[calc(100vw-2rem)] p-4">
                <p class="mb-4 text-sm font-semibold text-highlighted">
                  Get Your Caps Listed
                </p>
                <UStepper
                  :items="steps"
                  :default-value="steps.length - 1"
                  orientation="vertical"
                  disabled
                  :ui="{
                    description: 'text-pretty',
                    separator: 'opacity-100',
                  }"
                />
              </div>
            </template>
          </UPopover>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPage>
        <ArtisanMarketplaceListing :intent="intent" />
      </UPage>
    </template>
  </UDashboardPanel>
</template>

<script setup>
useSeoMeta({
  title: 'Trading Hub',
  description: 'Find buyers and sellers for artisan keycaps.',
})

const route = useRoute()
const router = useRouter()

const steps = [
  {
    icon: 'solar:add-folder-line-duotone',
    title: 'Create a Collection',
    description:
      'In My Collection, start a Wishlist for caps you are hunting, or a For Sale or Trade collection for caps you are letting go.',
  },
  {
    icon: 'solar:add-circle-line-duotone',
    title: 'Add Your Caps',
    description:
      'Each cap is listed while Still Looking or Available is on. Add a price or mark Top Priority if you like.',
  },
  {
    icon: 'solar:share-line-duotone',
    title: 'Make It Public',
    description:
      'Open Share on the collection and choose Create Public Link. Collectors reach you through its Discord username.',
  },
]

const intentItems = [
  { label: 'All', value: 'all' },
  { ...TRADE_INTENTS.want, value: 'want' },
  { ...TRADE_INTENTS.sell, value: 'sell' },
]

// kept in the URL; switching starts again from the first page
const intent = computed({
  get: () =>
    ['want', 'sell'].includes(route.query.intent) ? route.query.intent : 'all',
  set: (value) =>
    router.replace({
      path: route.path,
      query: {
        ...route.query,
        intent: value === 'all' ? undefined : value,
        page: undefined,
      },
    }),
})
</script>
