<template>
  <UDashboardPanel id="wishlist-preview">
    <template #header>
      <UDashboardNavbar title="Wishlist Preview">
        <template #right>
          <UButton icon="hugeicons:clipboard" @click="copyToClipboard">
            Copy Text
          </UButton>
          <UButton icon="hugeicons:album-01" @click="screenshot(false)">
            Copy Image
          </UButton>
          <UButton icon="hugeicons:image-download-02" @click="screenshot(true)">
            Save
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        v-if="tradingCfg.fnf_only"
        icon="hugeicons:alert-02"
        title="No PayPal Buyer Protection"
        description="Please note that the seller does not accept PayPal Goods & Services (G&S). This means that if you choose to proceed with the transaction, you will not have PayPal's buyer protection in place."
        variant="subtle"
        color="warning"
      />

      <UAlert
        v-if="errorText"
        :description="errorText"
        variant="subtle"
        color="error"
      />

      <USeparator
        v-if="buyingItems.length"
        :label="tradingCfg.buying.title"
        :ui="{
          label: 'font-bold text-3xl text-info',
        }"
      />

      <DraggableCard
        :data="buyingItems"
        :copying="copying"
        :buying="true"
        @on-remove="remove"
      />

      <USeparator
        v-if="sellingItems.length && trading"
        :label="tradingCfg.selling.title"
        :ui="{
          label: 'font-bold text-3xl text-warning',
        }"
      />

      <DraggableCard
        v-if="trading"
        :data="sellingItems"
        :copying="copying"
        :selling="true"
        @on-remove="remove"
      />
    </template>

    <!-- <template #footer>
      <UButton
        :avatar="{
          alt: $config.app.name,
          src:
            $colorMode.value === 'dark'
              ? '/logo-outlined.png'
              : '/logo-filled.png',
        }"
        color="primary"
      >
        From {{ $config.app.name }} with love
      </UButton>
    </template> -->
  </UDashboardPanel>
</template>

<script setup>
import groupBy from 'lodash.groupby'

const toast = useToast()

const userStore = useUserStore()
const { authenticated, user } = storeToRefs(userStore)

const tradingCfg = useState('trading-config')
const trading = computed(() => tradingCfg.value.type === 'trading')

const { isDesktop } = useDevice()

const { data: collections, refresh } = await useAsyncData(
  () => $fetch(`/api/users/${user.value.uid}/collection-items`),
  {
    transform: (data) => {
      return groupBy(data, 'collection_id')
    },
  },
)

const buyingItems = computed(
  () => collections.value[tradingCfg.value.buying.collection] || [],
)
const sellingItems = computed(
  () => collections.value[tradingCfg.value.selling.collection] || [],
)

watch(authenticated, () => refresh())

const remove = (item) => {
  collections.value[item.collection_id] = collections.value[
    item.collection_id
  ].filter((c) => c.id !== item.id)
}

const errorText = ref()
const copying = ref(false)

const screenshot = async (download = false) => {
  copying.value = true

  const card = document.getElementsByClassName('trading-preview')[0]

  try {
    if (download) {
      await downloadScreenshot(card)
    } else {
      await copyScreenshot(card, toast, !isDesktop)
    }
  } catch (error) {
    errorText.value = error.message
  }

  copying.value = false
}

const tradingItemText = ({ artisan, exchange }) => {
  return exchange
    ? `- ${colorwayTitle(artisan)}`
    : `- ~~${colorwayTitle(artisan)}~~`
}

const tradingText = computed(() => {
  let text =
    `**${tradingCfg.value.buying.title || tradingCfg.value.buying.placeholder}**\n` +
    `${buyingItems.value.map(tradingItemText).join('\n')}`

  if (trading.value) {
    text +=
      `\n\n` +
      `**${tradingCfg.value.selling.title || tradingCfg.value.selling.placeholder}**\n` +
      `${sellingItems.value.map(tradingItemText).join('\n')}`
  }

  return text
})

const copyToClipboard = () => {
  navigator.clipboard.writeText(tradingText.value)
  toast.add({
    severity: 'success',
    summary: 'Copied to clipboard!',
    life: 3000,
  })
}
</script>
