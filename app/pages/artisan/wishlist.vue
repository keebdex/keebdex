<template>
  <UDashboardPanel :ui="{ root: 'flex-row' }">
    <UDashboardPanel
      v-if="authenticated"
      id="wishlist"
      :default-size="20"
      :min-size="15"
      :max-size="25"
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

      <ArtisanWishlistSettings class="p-4" />
    </UDashboardPanel>

    <ArtisanWishlistPreview />

    <ClientOnly>
      <USlideover v-if="isMobileOrTablet" v-model:open="showPreview">
        <template #content>
          <ArtisanWishlistPreview @close="showPreview = false" />
        </template>
      </USlideover>
    </ClientOnly>
  </UDashboardPanel>
</template>

<script setup>
useSeoMeta({
  title: 'Wishlist',
  description:
    'Quickly generate visual wishlists for buying & selling. Share on Discord, social media, and more.',
})

const { isMobileOrTablet } = useDevice()
const userStore = useUserStore()
const { authenticated, social } = storeToRefs(userStore)

const tradingConfig = useState('trading-config', () => {
  return {
    selling: {
      collection: undefined,
      title: '',
      placeholder: 'WTS/WTT',
    },
    buying: {
      collection: undefined,
      title: '',
      placeholder: 'WTB/WTTF',
    },
    social,
    type: 'buying',
    fnf_only: false,
    shipping_included: false,
    highlight_filled: false,
  }
})

const showPreview = useState('wishlist-preview')

const resetTradingState = () => {
  tradingConfig.value.buying = {
    collection: undefined,
    title: '',
    placeholder: 'WTB/WTTF',
  }
  tradingConfig.value.selling = {
    collection: undefined,
    title: '',
    placeholder: 'WTS/WTT',
  }
  tradingConfig.value.fnf_only = false
  tradingConfig.value.shipping_included = false
  tradingConfig.value.highlight_filled = false
}

const tabItems = [
  { label: 'Buying', value: 'buying' },
  { label: 'Selling', value: 'selling' },
  { label: 'Trading', value: 'trading' },
]
</script>
