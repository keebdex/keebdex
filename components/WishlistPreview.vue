<template>
  <Panel
    v-if="buyingItems.length || sellingItems.length"
    :header="copying ? 'Contact' : 'Preview'"
    pt:root:class="trading-preview"
    pt:header:class="text-xl"
    pt:header-actions:class="flex gap-2"
  >
    <template v-if="!copying" #icons>
      <Button
        size="small"
        severity="secondary"
        label="Copy Text"
        icon="pi pi-clipboard"
        @click="copyToClipboard"
      />
      <Button
        size="small"
        severity="secondary"
        label="Copy Image"
        icon="pi pi-images"
        @click="screenshot(false)"
      />
      <Button
        size="small"
        severity="secondary"
        label="Download"
        icon="pi pi-download"
        @click="screenshot(true)"
      />
    </template>

    <div class="flex flex-col gap-6">
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
      >
        <Message
          v-if="tradingCfg.social.discord"
          size="large"
          icon="pi pi-discord"
          severity="info"
          variant="simple"
        >
          {{ tradingCfg.social.discord }}
        </Message>
        <Message
          v-if="tradingCfg.social.reddit"
          size="large"
          icon="pi pi-reddit"
          severity="error"
          variant="simple"
        >
          {{ tradingCfg.social.reddit }}
        </Message>
        <Message
          v-if="tradingCfg.social.qq"
          size="large"
          icon="pi pi-comment"
          severity="warn"
          variant="simple"
        >
          {{ tradingCfg.social.qq }}
        </Message>
      </div>

      <Message
        v-if="buyingItems.length + sellingItems.length >= 24 && !copying"
        variant="simple"
        icon="pi pi-info-circle"
      >
        For optimal image display, it's <strong>recommended</strong> to keep
        your wishlist between 16-24 items.
      </Message>

      <Message
        v-if="tradingCfg.fnf_only"
        severity="warn"
        icon="pi pi-exclamation-triangle"
        variant="simple"
      >
        Please note that the seller does not accept PayPal Goods & Services
        (G&S). This means that if you choose to proceed with the transaction,
        you will not have PayPal's buyer protection in place.
      </Message>

      <Message v-if="errorText" class="w-fit mx-auto" severity="error">
        {{ errorText }}
      </Message>

      <Divider
        v-if="buyingItems.length"
        align="center"
        class="text-4xl font-bold"
      >
        {{ tradingCfg.buying.title }}
      </Divider>

      <DraggableCard
        :data="buyingItems"
        :copying="copying"
        :buying="true"
        @on-remove="remove"
      />

      <Divider
        v-if="sellingItems.length && trading"
        align="center"
        class="text-4xl font-bold"
      >
        {{ tradingCfg.selling.title }}
      </Divider>

      <DraggableCard
        v-if="trading"
        :data="sellingItems"
        :copying="copying"
        :selling="true"
        @on-remove="remove"
      />

      <Message variant="simple" severity="success">
        <template #icon>
          <NuxtImg
            class="h-8"
            :alt="$config.app.name"
            :src="
              $colorMode.value === 'dark'
                ? '/logo-outlined.png'
                : '/logo-filled.png'
            "
          />
        </template>
        From {{ $config.app.name }} with love
      </Message>
    </div>

    <Toast />
  </Panel>
</template>

<script setup>
import groupBy from 'lodash.groupby'

const confirm = useConfirm()
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
  confirm.require({
    header: 'Confirm to remove artisan',
    message: 'Are you sure you want to continue?',
    rejectProps: {
      size: 'small',
      label: 'Cancel',
      severity: 'secondary',
    },
    acceptProps: {
      size: 'small',
      label: 'Remove',
      severity: 'danger',
    },
    accept: () => {
      collections.value[item.collection_id] = collections.value[
        item.collection_id
      ].filter((c) => c.id !== item.id)
    },
  })
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
