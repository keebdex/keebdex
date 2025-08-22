<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <UDashboardPanel
    v-if="authenticated"
    id="wishlist"
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
  >
    <template v-if="!authenticated" #links>
      <UButton
        icon="hugeicons:login-03"
        @click="
          () => {
            visible = true
          }
        "
      >
        Sign In to Continue
      </UButton>
    </template>
  </UPageSection>

  <UModal v-model:open="visible">
    <template #content>
      <UPageCard>
        <ModalLogin />
      </UPageCard>
    </template>
  </UModal>
</template>

<script setup>
useSeoMeta({
  title: 'Wishlist',
  description:
    'Quickly generate visual wishlists for buying & selling. Share on Discord, social media, and more.',
})

const visible = ref(false)

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
