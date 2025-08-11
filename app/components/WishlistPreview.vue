<template>
  <UDashboardPanel
    id="wishlist-preview"
    :ui="{ body: 'trading-preview bg-(--ui-bg)' }"
  >
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
      <UPageHeader
        title="Information"
        :ui="{
          root: 'border-none',
        }"
      >
        <template #description>
          <UPageGrid
            class="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-8 gap-4"
          >
            <UUser
              v-if="tradingCfg.social.discord"
              :name="tradingCfg.social.discord"
              size="2xl"
              :avatar="{
                icon: 'hugeicons:discord',
              }"
            />

            <UUser
              v-if="tradingCfg.social.reddit"
              :name="tradingCfg.social.reddit"
              size="2xl"
              :avatar="{
                icon: 'hugeicons:reddit',
              }"
            />

            <UUser
              v-if="tradingCfg.social.qq"
              :name="tradingCfg.social.qq"
              size="2xl"
              :avatar="{
                icon: 'hugeicons:bubble-chat',
              }"
            />
          </UPageGrid>

          <UAlert
            v-if="tradingCfg.fnf_only"
            icon="hugeicons:alert-02"
            title="No PayPal Buyer Protection"
            description="Please note that the seller does not accept PayPal Goods & Services (G&S). This means that if you choose to proceed with the transaction, you will not have PayPal's buyer protection in place."
            variant="subtle"
            color="warning"
            class="mt-4"
          />
        </template>
      </UPageHeader>

      <UAlert
        v-if="errorText"
        :description="errorText"
        variant="subtle"
        color="error"
      />

      <USeparator
        v-if="buyingItems.length && tradingCfg.buying.title"
        :label="tradingCfg.buying.title"
        :ui="{
          label: 'text-3xl sm:text-4xl font-bold text-info',
        }"
      />

      <DraggableCard
        :data="buyingItems"
        :copying="copying"
        :buying="tradingCfg.type !== 'selling'"
        @on-remove="remove"
        @on-highlight="changePriority"
      />

      <USeparator
        v-if="sellingItems.length && trading"
        :label="tradingCfg.selling.title"
        :ui="{
          label: 'text-3xl sm:text-4xl font-bold text-warning',
        }"
      />

      <DraggableCard
        v-if="trading"
        :data="sellingItems"
        :copying="copying"
        :selling="true"
        @on-remove="remove"
      />

      <USeparator>
        <UUser
          :name="`From ${$config.app.name} with love`"
          size="3xl"
          :avatar="{
            alt: $config.app.name,
            src:
              $colorMode.value === 'dark'
                ? '/logo-outlined.png'
                : '/logo-filled.png',
            ui: {
              root: 'rounded-none bg-transparent',
            },
          }"
        />
      </USeparator>
    </template>
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

const changePriority = (itemId) => {
  buyingItems.value.forEach((item) => {
    if (item.id === itemId) {
      item.priority = !item.priority
    }
  })
}

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
    color: 'success',
    title: 'Copied to clipboard!',
  })
}
</script>
