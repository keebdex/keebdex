<template>
  <UDashboardPanel v-if="authenticated" id="wishlist-preview">
    <template #header>
      <UDashboardNavbar title="Wishlist Preview" :toggle="false">
        <template v-if="!isMobile" #right>
          <UButton icon="hugeicons:clipboard" @click="copyToClipboard">
            Copy Text
          </UButton>
          <UButton icon="hugeicons:album-01" @click="copyImage">
            Copy Image
          </UButton>
          <UButton icon="hugeicons:image-download-02" @click="saveImage">
            Save
          </UButton>

          <UButton
            icon="hugeicons:layout-align-right"
            :label="sidebarOpen ? 'Hide Settings' : 'Show Settings'"
            @click="sidebarOpen = !sidebarOpen"
          />
        </template>
        <template v-else #right>
          <UButton
            icon="hugeicons:settings-02"
            aria-label="Wishlist Settings"
            color="neutral"
            variant="ghost"
            @click="sidebarOpen = !sidebarOpen"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="isMobile && totalItems">
        <UButton block icon="hugeicons:clipboard" @click="copyToClipboard">
          Copy Text
        </UButton>
        <UButton block icon="hugeicons:image-upload" @click="openExport">
          Export Image
        </UButton>
      </UDashboardToolbar>
    </template>

    <template v-if="totalItems" #body>
      <UAlert
        v-if="errorText"
        :description="errorText"
        variant="subtle"
        color="error"
      />

      <ArtisanWishlistSheet
        :buying-items="buyingItems"
        :selling-items="sellingItems"
        editable
        :compact="isMobile"
        @remove="remove"
        @highlight="changePriority"
      />

      <!-- Exported image: fixed width on every device, kept off screen. -->
      <ClientOnly>
        <div
          class="fixed top-0 -left-[10000px] pointer-events-none"
          aria-hidden="true"
        >
          <ArtisanWishlistSheet
            ref="exportSheet"
            :buying-items="buyingItems"
            :selling-items="sellingItems"
          />
        </div>
      </ClientOnly>

      <UModal
        v-model:open="exportOpen"
        title="Export Image"
        description="Share your wishlist, save it to your photos, or copy it."
        :ui="{ footer: 'grid grid-cols-2 gap-2' }"
      >
        <template #body>
          <div
            v-if="exportUrl"
            class="max-h-[60vh] overflow-auto rounded-md border border-default"
          >
            <img :src="exportUrl" alt="Wishlist image" class="w-full" >
          </div>
          <UEmpty
            v-else-if="exportError"
            icon="hugeicons:image-not-found-01"
            title="Image Not Created"
            :description="exportError"
            :actions="[{ label: 'Try Again', onClick: renderExport }]"
          />
          <USkeleton v-else class="aspect-[3/4] w-full" />
        </template>

        <template #footer>
          <UButton
            v-if="shareSupported"
            block
            icon="hugeicons:share-08"
            :disabled="!exportBlob"
            class="col-span-2"
            @click="shareImage"
          >
            Share
          </UButton>
          <UButton
            block
            icon="hugeicons:image-download-02"
            color="neutral"
            variant="subtle"
            :disabled="!exportBlob"
            @click="downloadBlob(exportBlob, filename)"
          >
            Save
          </UButton>
          <UButton
            block
            icon="hugeicons:album-01"
            color="neutral"
            variant="subtle"
            :disabled="!exportBlob"
            @click="copyBlob(exportBlob, toast)"
          >
            Copy Image
          </UButton>
        </template>
      </UModal>
    </template>
    <template v-else #body>
      <UEmpty
        icon="hugeicons:collections-bookmark"
        title="Your Wishlist Awaits"
        description="Pick a collection and we will turn it into a wishlist you can tweak and share."
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

const { isMobile } = useDevice()
const toast = useToast()
const userStore = useUserStore()
const { authenticated, user } = storeToRefs(userStore)

const tradingCfg = useTradingConfig()
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
const exportSheet = useTemplateRef('exportSheet')
const filename = computed(() => `wishlist-${tradingCfg.value.type}`)

const capture = () => captureScreenshot(exportSheet.value.$el)

// The capture promise goes straight into the clipboard write (Safari).
const copyImage = () => {
  errorText.value = undefined
  copyBlob(capture(), toast)
}

const saveImage = async () => {
  errorText.value = undefined

  try {
    downloadBlob(await capture(), filename.value)
  } catch (error) {
    errorText.value = error.message
  }
}

// Mobile: render the image first, so Share/Save/Copy run on a ready blob
// inside the tap gesture.
const exportOpen = ref(false)
const exportBlob = ref()
const exportUrl = ref()
const exportError = ref()
const shareSupported = ref(false)

onMounted(() => {
  shareSupported.value = canShareFiles()
})

const clearExport = () => {
  if (exportUrl.value) URL.revokeObjectURL(exportUrl.value)
  exportBlob.value = undefined
  exportUrl.value = undefined
  exportError.value = undefined
}

const renderExport = async () => {
  clearExport()

  try {
    const blob = await capture()
    exportBlob.value = blob
    exportUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    exportError.value = error.message
  }
}

const openExport = () => {
  exportOpen.value = true
  renderExport()
}

watch(exportOpen, (open) => {
  if (!open) clearExport()
})

onBeforeUnmount(clearExport)

const shareImage = async () => {
  try {
    await shareBlob(exportBlob.value, filename.value)
  } catch (error) {
    toast.add(errorToast(error))
  }
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
  toast.add(noticeToast('copied'))
}
</script>
