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
        <!-- How a collection gets here, in the order it happens; folded on
        phones, where the steps would fill the first screen -->
        <UCollapsible
          :default-open="!$device.isMobile"
          class="rounded-lg bg-elevated/50 ring ring-default"
        >
          <UButton
            label="How to list your caps here"
            icon="hugeicons:information-circle"
            trailing-icon="hugeicons:arrow-down-01"
            variant="ghost"
            block
            class="group px-4 py-3 sm:px-5"
            :ui="{
              label: 'block flex-1 text-start',
              trailingIcon:
                'transition-transform group-data-[state=open]:rotate-180',
            }"
          />

          <template #content>
            <!-- Every step shows as done, since this is a guide rather than
            a wizard; across the panel, or down it on phones -->
            <UStepper
              :items="steps"
              :default-value="steps.length - 1"
              :orientation="$device.isMobile ? 'vertical' : 'horizontal'"
              disabled
              class="px-4 pb-4 sm:px-5 sm:pb-5"
              :ui="{
                // Room between the steps' text, which the separators skip
                wrapper: 'sm:px-4',
                description: 'text-pretty',
                separator: 'opacity-100',
              }"
            />
          </template>
        </UCollapsible>

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

const steps = [
  {
    icon: 'hugeicons:folder-add',
    title: 'Make a collection',
    description:
      'In My Collection, create a Wishlist for caps you want, or a For Sale or Trade collection for caps you have.',
  },
  {
    icon: 'hugeicons:add-circle',
    title: 'Add your caps',
    description:
      'Each cap shows here while Still Looking or Available is on, with a price and Top Priority if you like.',
  },
  {
    icon: 'hugeicons:share-08',
    title: 'Share it',
    description:
      'Choose Create Public Link under Share on its page, and collectors can reach you on Discord.',
  },
]

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
