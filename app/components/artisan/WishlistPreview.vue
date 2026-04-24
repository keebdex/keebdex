<template>
  <UDashboardPanel
    v-if="authenticated"
    id="wishlist-preview"
    :style="previewVars"
    :ui="{
      body: 'bg-(--ui-bg)',
    }"
  >
    <template #header>
      <UDashboardNavbar title="Wishlist" :toggle="false">
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

          <UButton
            icon="hugeicons:layout-align-right"
            :label="sidebarOpen ? 'Hide Configuration' : 'Show Configuration'"
            @click="sidebarOpen = !sidebarOpen"
          />
        </template>
        <template v-else #right>
          <UButton
            icon="hugeicons:layout-align-right"
            @click="sidebarOpen = !sidebarOpen"
          >
            {{ sidebarOpen ? 'Hide Configuration' : 'Show Configuration' }}
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

    <template v-if="totalItems" #body>
      <div
        class="trading-preview mx-auto flex flex-col gap-8"
        :style="previewStyle"
      >
        <UPage v-if="isMobile && !copying">
          <UAlert
            title="Actions may not work as expected on mobile devices."
            icon="hugeicons:alert-02"
            color="warning"
          />
        </UPage>

        <UPageHeader
          title="Information"
          :links="
            tradingCfg.shipping_included
              ? [
                  {
                    label: 'Shipping Included',
                    icon: 'hugeicons:package-moving',
                    color: 'info',
                    variant: 'soft',
                    size: 'xl',
                  },
                ]
              : [
                  {
                    label: $config.public.site.name,
                    avatar: {
                      alt: $config.public.site.name,
                      src:
                        $colorMode.value === 'dark'
                          ? '/logo-outlined.png'
                          : '/logo-filled.png',
                      ui: {
                        root: 'rounded-none bg-transparent',
                      },
                    },
                    color: 'info',
                    variant: 'soft',
                    size: 'xl',
                  },
                ]
          "
          :ui="{
            root: 'border-none',
          }"
        >
          <template #description>
            <UPageGrid class="grid gap-4" :style="socialGridStyle">
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
              v-if="!copying"
              icon="hugeicons:information-circle"
              variant="subtle"
              color="info"
              class="mt-4"
            >
              <template #description>
                Click and drag cards to change their order. You can update
                asking prices in the
                <ULink
                  :to="`/collection/artisan/${tradingCfg.selling.collection || tradingCfg.buying.collection}`"
                >
                  Manage Collection
                </ULink>
                page.
              </template>
            </UAlert>

            <UAlert
              v-if="totalItems > 24 && !copying"
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
          v-if="buyingItems.length"
          :label="
            tradingCfg.buying.title ||
            (tradingCfg.type === 'selling'
              ? tradingCfg.selling.placeholder
              : tradingCfg.buying.placeholder)
          "
          :ui="{
            label: 'text-3xl sm:text-4xl font-bold text-info',
          }"
        />

        <ArtisanWishlistDraggableCard
          :data="buyingItems"
          :copying="copying"
          :buying="tradingCfg.type !== 'selling'"
          @on-remove="remove"
          @on-highlight="changePriority"
        />

        <USeparator
          v-if="sellingItems.length && trading"
          :label="tradingCfg.selling.title || tradingCfg.selling.placeholder"
          :ui="{
            label: 'text-3xl sm:text-4xl font-bold text-warning',
          }"
        />

        <ArtisanWishlistDraggableCard
          v-if="trading"
          :data="sellingItems"
          :copying="copying"
          :selling="true"
          @on-remove="remove"
        />

        <USeparator class="mt-16">
          <UUser
            :name="`From ${$config.public.site.name} with love`"
            size="3xl"
            :avatar="{
              alt: $config.public.site.name,
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
      </div>
    </template>
    <template v-else #body>
      <UPageSection
        icon="hugeicons:zoom-in-area"
        title="No Collection Selected"
        description="Start by choosing a collection to generate your wishlist. Once selected, you can preview, edit, and share it easily."
        class="mx-auto"
      />
    </template>
  </UDashboardPanel>
  <SharedProtectedPage
    v-else
    icon="hugeicons:creative-market"
    title="Wishlist Image Builder"
    description="Quickly generate visual wishlists for buying & selling. Share on Discord, social media, and more."
  />
</template>

<script setup>
import groupBy from 'lodash.groupby'
import sortBy from 'lodash.sortby'

const { isDesktop, isMobile } = useDevice()
const toast = useToast()
const userStore = useUserStore()
const { authenticated, user } = storeToRefs(userStore)

const tradingCfg = useState('trading-config')
const sidebarOpen = useState('wishlist-sidebar-open', () => true)
const trading = computed(() => tradingCfg.value.type === 'trading')

const { data: collections, refresh } = await useAsyncData(
  () => $fetch(`/api/users/${user.value.uid}/collection-items`).catch(() => []),
  {
    watch: [user],
    transform: (data) => {
      return Object.values(groupBy(data, 'collection_id')).reduce(
        (out, cur) => {
          out[cur[0].collection_id] = sortBy(cur, ['order', 'id'])

          return out
        },
        {},
      )
    },
  },
)

const buyingItems = ref([])
const sellingItems = ref([])

const previewVars = computed(() => ({
  '--wishlist-card-width': '18rem',
  '--wishlist-grid-gap': '1rem',
}))

watchEffect(() => {
  buyingItems.value =
    collections.value[tradingCfg.value.buying.collection] || []
  sellingItems.value =
    collections.value[tradingCfg.value.selling.collection] || []
})

const totalItems = computed(
  () => buyingItems.value.length + sellingItems.value.length,
)

const configuredColumns = computed(() =>
  Math.max(1, tradingCfg.value.columns || 1),
)

const getSectionColumns = (items) => {
  if (!items.length) return 0

  return Math.min(items.length, configuredColumns.value)
}

const previewColumns = computed(() => {
  const buyingColumns = getSectionColumns(buyingItems.value)
  const sellingColumns = trading.value
    ? getSectionColumns(sellingItems.value)
    : 0

  return Math.max(1, buyingColumns, sellingColumns)
})

const previewStyle = computed(() => {
  if (isMobile) return undefined

  return {
    width: `min(100%, calc(${previewColumns.value} * var(--wishlist-card-width) + ${Math.max(previewColumns.value - 1, 0)} * var(--wishlist-grid-gap)))`,
  }
})

const socialGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.min(3, previewColumns.value)}, minmax(0, 1fr))`,
}))

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
      await downloadScreenshot(card, tradingCfg.value.type)
    } else {
      await copyScreenshot(card, toast, !isDesktop)
    }
  } catch (error) {
    errorText.value = error.message
  }

  card.classList.add('flex-1')

  copying.value = false
}

const tradingItemText = ({ artisan, exchange, asking_price }) => {
  if (exchange) {
    return asking_price
      ? `- ${colorwayTitle(artisan)} - $${asking_price}`
      : `- ${colorwayTitle(artisan)}`
  }

  return `- ~~${colorwayTitle(artisan)}~~`
}

const tradingText = computed(() => {
  let text =
    `**${tradingCfg.value.buying.title || (tradingCfg.value.type === 'selling' ? tradingCfg.value.selling.placeholder : tradingCfg.value.buying.placeholder)}**\n` +
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
  toast.add(handleNotice('copy'))
}
</script>
