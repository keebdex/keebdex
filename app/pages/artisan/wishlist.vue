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

      <WishlistSettings class="p-4" />
    </UDashboardPanel>

    <WishlistPreview />

    <ClientOnly>
      <USlideover v-if="isMobileOrTablet" v-model:open="showPreview">
        <template #content>
          <WishlistPreview @close="showPreview = false" />
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
      placeholder: 'For sale',
    },
    buying: {
      collection: undefined,
      title: '',
      placeholder: 'Looking for',
    },
    social,
    type: 'buying',
    fnf_only: false,
  }
})

const showPreview = useState('wishlist-preview')

const resetTradingState = () => {
  tradingConfig.value.buying = {
    collection: undefined,
    title: '',
    placeholder: 'Looking for',
  }
  tradingConfig.value.selling = {
    collection: undefined,
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
