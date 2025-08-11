<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <!-- <Panel
    header="Wishlist"
    pt:root:class="!border-0 !bg-transparent"
    pt:title:class="flex items-center gap-4 font-medium text-3xl"
  >
    <Message
      class="w-fit mx-auto mb-4"
      severity="warn"
      icon="pi pi-exclamation-triangle"
    >
      <strong>Attention:</strong> We're phasing out this feature. Check out the
      <nuxt-link to="/artisan/marketplace"> Marketplace </nuxt-link> for
      powerful alternatives!
    </Message>

    <div v-if="$device.isDesktop" class="flex flex-col gap-4">
      <WishlistSettings />
      <WishlistPreview />
    </div>
    <div v-else class="flex flex-col items-center text-center gap-8">
      <NuxtImg class="w-2/3" src="/svg/access-denied.svg" alt="Access Denied" />

      <Message variant="simple" size="large">
        This feature isn't available on mobile.
      </Message>
      <Message variant="simple" severity="secondary">
        Please use a tablet or desktop for full access, or explore our
        Marketplace for powerful alternatives.
      </Message>

      <nuxt-link to="/artisan/marketplace">
        <Button label="Marketplace" icon="pi pi-shop" />
      </nuxt-link>
    </div>
  </Panel> -->

  <UDashboardPanel
    id="inbox-1"
    :default-size="25"
    :min-size="20"
    :max-size="30"
    resizable
  >
    <UDashboardNavbar title="Information">
      <template #right>
        <UTabs
          v-model="tradingConfig.type"
          :items="tabItems"
          :content="false"
          size="xs"
          default-value="buying"
          @update:model-value="resetTradingState"
        />
      </template>
    </UDashboardNavbar>

    <WishlistSettings class="p-4" />
  </UDashboardPanel>

  <WishlistPreview
    v-if="tradingConfig.buying.collection || tradingConfig.selling.collection"
  />
  <UPageSection
    v-else
    title="Wishlist Image Builder"
    description="Quickly generate visual wishlists for buying & selling. Share on Discord, social media, and more."
    icon="hugeicons:creative-market"
    class="mx-auto"
  />
</template>

<script setup>
useSeoMeta({
  title: 'Wishlist',
  description:
    'Quickly generate visual wishlists for buying & selling. Share on Discord, social media, and more.',
})

const userStore = useUserStore()
const { social } = storeToRefs(userStore)

const tradingConfig = useState('trading-config', () => {
  return {
    selling: {
      collection: '',
      title: '',
      placeholder: 'For sale',
    },
    buying: {
      collection: '',
      title: '',
      placeholder: 'Looking for',
    },
    social,
    type: 'buying',
    fnf_only: false,
  }
})

const resetTradingState = () => {
  tradingConfig.value.buying = {
    collection: '',
    title: '',
    placeholder: 'Looking for',
  }
  tradingConfig.value.selling = {
    collection: '',
    title: '',
    placeholder: 'For sale',
  }
}

const tabItems = [
  { label: 'Buying', value: 'buying' },
  { label: 'Selling', value: 'selling' },
  { label: 'Trading', value: 'trading' },
]
</script>
