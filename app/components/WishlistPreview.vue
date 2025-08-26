<template>
  <UDashboardPanel
    v-if="totalItems"
    id="wishlist-preview"
    :ui="{ body: 'trading-preview bg-(--ui-bg)' }"
  >
    <template #header>
      <UDashboardNavbar title="Preview" :toggle="false">
        <template v-if="isMobile" #leading>
          <UButton
            icon="hugeicons:cancel-01"
            color="neutral"
            variant="ghost"
            class="-ms-1.5"
            @click="emit('close')"
          />
        </template>

        <template v-if="!isMobile" #right>
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

      <UDashboardToolbar v-if="isMobile">
        <UButton block icon="hugeicons:clipboard" @click="copyToClipboard">
          Copy Text
        </UButton>
        <UButton block icon="hugeicons:album-01" @click="screenshot(false)">
          Copy Image
        </UButton>
        <UButton
          block
          icon="hugeicons:image-download-02"
          @click="screenshot(true)"
        >
          Save
        </UButton>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPage v-if="isMobile && !copying">
        <UAlert
          title="Actions may not work as expected on mobile devices."
          icon="hugeicons:alert-02"
          variant="soft"
          color="warning"
        />
      </UPage>

      <UPageHeader
        title="Information"
        :ui="{
          root: 'border-none',
        }"
        :links="[
          {
            label: 'Priority',
            icon: 'hugeicons:highlighter',
            color: 'primary',
            variant: 'subtle',
            disabled: true,
          },
        ]"
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
                ui: {
                  icon: 'text-(--color-discord)',
                },
              }"
              :ui="{
                name: 'text-(--color-discord)',
              }"
            />

            <UUser
              v-if="tradingCfg.social.reddit"
              :name="tradingCfg.social.reddit"
              size="2xl"
              :avatar="{
                icon: 'hugeicons:reddit',
                ui: {
                  icon: 'text-(--color-reddit)',
                },
              }"
              :ui="{
                name: 'text-(--color-reddit)',
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
            v-if="totalItems >= 24 && !copying"
            icon="hugeicons:information-circle"
            variant="subtle"
            color="info"
            class="mt-4"
          >
            <template #description>
              For optimal image display, it's <strong>recommended</strong> to
              keep your wishlist between 16-24 items.
            </template>
          </UAlert>

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

      <USeparator class="mt-16">
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
  <UPageSection
    v-else
    title="Wishlist Image Builder"
    description="Quickly generate visual wishlists for buying & selling. Share on Discord, social media, and more."
    icon="hugeicons:creative-market"
    class="mx-auto"
  >
    <template v-if="!authenticated" #links>
      <UButton icon="hugeicons:login-03" @click="visible = true">
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
import groupBy from 'lodash.groupby'

const emit = defineEmits(['close'])

const { isDesktop, isMobile } = useDevice()
const toast = useToast()
const userStore = useUserStore()
const { authenticated, user } = storeToRefs(userStore)

const tradingCfg = useState('trading-config')
const trading = computed(() => tradingCfg.value.type === 'trading')

const visible = ref(false)

const { data: collections, refresh } = await useAsyncData(
  () => $fetch(`/api/users/${user.value.uid}/collection-items`),
  {
    transform: (data) => {
      return groupBy(data, 'collection_id')
    },
  },
)

const buyingItems = ref([])
const sellingItems = ref([])

watchEffect(() => {
  buyingItems.value =
    collections.value[tradingCfg.value.buying.collection] || []
  sellingItems.value =
    collections.value[tradingCfg.value.selling.collection] || []
})

const totalItems = computed(
  () => buyingItems.value.length + sellingItems.value.length,
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
  // Replace array → ensures Vue updates UI
  if (item.collection_id === tradingCfg.value.buying.collection) {
    buyingItems.value = buyingItems.value.filter((i) => i.id !== item.id)
  } else if (item.collection_id === tradingCfg.value.selling.collection) {
    sellingItems.value = sellingItems.value.filter((i) => i.id !== item.id)
  }
}

const errorText = ref()
const copying = ref(false)

const screenshot = async (download = false) => {
  copying.value = true

  // wait a sec to hide footer
  await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })

  const card = document.getElementsByClassName('trading-preview')[0]

  // remove 'flex-1' class to eliminate unnecessary spacing
  card.classList.remove('flex-1')

  try {
    if (download) {
      await downloadScreenshot(card)
    } else {
      await copyScreenshot(card, toast, !isDesktop)
    }
  } catch (error) {
    errorText.value = error.message
  }

  card.classList.add('flex-1')

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
