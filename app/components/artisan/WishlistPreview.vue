<template>
  <UDashboardPanel v-if="authenticated" id="wishlist-preview">
    <template #header>
      <UDashboardNavbar title="Wishlist Preview" :toggle="false">
        <template #right>
          <template v-if="totalItems">
            <template v-if="!isMobile">
              <UButton icon="hugeicons:album-01" @click="copyImage">
                Copy Image
              </UButton>
              <UButton
                icon="hugeicons:image-download-02"
                @click="downloadImage"
              >
                Download
              </UButton>
            </template>
            <UButton icon="hugeicons:share-08" @click="shareOpen = true">
              Share
            </UButton>
          </template>

          <UButton
            v-if="isMobile"
            icon="hugeicons:settings-02"
            aria-label="Wishlist Settings"
            @click="sidebarOpen = !sidebarOpen"
          />
          <UButton
            v-else
            icon="hugeicons:layout-align-right"
            :label="sidebarOpen ? 'Hide Settings' : 'Show Settings'"
            @click="sidebarOpen = !sidebarOpen"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template v-if="totalItems" #body>
      <ArtisanWishlistSheet
        :buying-items="buyingItems"
        :selling-items="sellingItems"
        editable
        :compact="isMobile"
        @remove="remove"
        @highlight="changePriority"
      />

      <SharedSnapshot ref="snapshot">
        <ArtisanWishlistSheet
          :buying-items="buyingItems"
          :selling-items="sellingItems"
        />
      </SharedSnapshot>

      <ArtisanWishlistShareModal
        v-model:open="shareOpen"
        :capture="capture"
        :sections="textSections"
        :filename="filename"
      />
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

const snapshot = useTemplateRef('snapshot')
const filename = computed(() => `wishlist-${tradingCfg.value.type}`)

const capture = () => snapshot.value.capture()

// The capture promise goes straight into the clipboard write (Safari).
const copyImage = () => copyBlob(capture(), toast)

const downloadImage = async () => {
  try {
    downloadBlob(await capture(), filename.value)
  } catch (error) {
    toast.add(errorToast(error))
  }
}

const shareOpen = ref(false)

const textSections = computed(() => {
  const { type, buying, selling } = tradingCfg.value
  const sections = [
    {
      title:
        buying.title ||
        (type === 'selling' ? selling.placeholder : buying.placeholder),
      items: buyingItems.value,
      buying: type !== 'selling',
    },
  ]

  if (trading.value) {
    sections.push({
      title: selling.title || selling.placeholder,
      items: sellingItems.value,
      buying: false,
    })
  }

  return sections
})
</script>
