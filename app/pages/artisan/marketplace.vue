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
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPage>
        <UAlert icon="hugeicons:information-circle" color="info">
          <template #description>
            To list your caps here, create a
            <span class="font-medium">Wishlist</span> or
            <span class="font-medium">For Sale or Trade</span> collection in
            <ULink to="/collection" class="underline">My Collection</ULink>,
            then choose <span class="font-medium">Create Public Link</span>
            under Share on its page.
          </template>
        </UAlert>

        <ArtisanMarketplaceListing :intent="intent" class="mt-6" />
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

const intentItems = [
  { label: 'All', value: 'all' },
  { label: 'Buying', value: 'want', icon: 'hugeicons:money-bag-02' },
  { label: 'Selling', value: 'sell', icon: 'hugeicons:sale-tag-02' },
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
