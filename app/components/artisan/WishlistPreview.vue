<template>
  <UDashboardPanel v-if="authenticated" id="wishlist-preview">
    <template #header>
      <UDashboardNavbar title="Wishlist Preview" :toggle="false">
        <template #right>
          <UButton
            v-if="totalItems"
            icon="hugeicons:image-download-02"
            @click="shareOpen = true"
          >
            Save & Share
          </UButton>

          <!-- Before a collection is picked, the empty state's button opens them. -->
          <UButton
            v-if="isMobile && hasCollection"
            icon="hugeicons:settings-02"
            aria-label="Wishlist Settings"
            @click="sidebarOpen = !sidebarOpen"
          />
          <UButton
            v-else-if="!isMobile"
            icon="hugeicons:layout-align-right"
            :label="sidebarOpen ? 'Hide Settings' : 'Show Settings'"
            @click="sidebarOpen = !sidebarOpen"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template v-if="totalItems" #body>
      <UAlert
        v-if="!dragHintSeen"
        icon="hugeicons:drag-drop"
        color="info"
        variant="subtle"
        title="Make It Yours"
        :description="
          isMobile
            ? 'Press and hold a card, then drag it to reorder your list.'
            : 'Drag cards to reorder your list.'
        "
        close
        class="mx-auto max-w-3xl shrink-0"
        @update:open="dragHintSeen = true"
      />

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
        v-if="hasCollection"
        icon="hugeicons:package-open"
        title="Nothing on This List Yet"
        description="This collection has no artisans yet. Add a few caps, or pick another collection."
        :actions="[
          {
            label: 'Pick Another Collection',
            icon: 'hugeicons:settings-02',
            onClick: () => (sidebarOpen = true),
            ui: { label: 'block' },
          },
          {
            label: 'Browse Makers',
            icon: 'hugeicons:search-01',
            color: 'neutral',
            to: '/artisan/maker',
            ui: { label: 'block' },
          },
        ]"
      />
      <UEmpty
        v-else
        icon="hugeicons:collections-bookmark"
        title="Your Wishlist Awaits"
        description="Pick a collection, and we will turn it into a wishlist you can tweak and share."
        :actions="[
          {
            label: 'Pick a Collection',
            icon: 'hugeicons:settings-02',
            onClick: () => (sidebarOpen = true),
            ui: { label: 'block' },
          },
        ]"
      />
    </template>
  </UDashboardPanel>
  <SharedProtectedPage
    v-else
    icon="hugeicons:magic-wand-01"
    title="Flex Your Wishlist"
    nav-title="Wishlist Image"
    description="Turn your artisan collections into a slick WTB, WTS, or trade image in seconds, ready to drop in Discord, Reddit, or the group chat."
    :features="signedOutFeatures"
    sign-in-label="Sign In to Start Building"
  />
</template>

<script setup>
import groupBy from 'lodash.groupby'
import sortBy from 'lodash.sortby'

const { isMobile } = useDevice()

const signedOutFeatures = [
  {
    icon: 'hugeicons:drag-drop',
    title: 'Drag, Drop, Done',
    description:
      'Line up your caps, flag your grails, and mark the ones you already found.',
  },
  {
    icon: 'hugeicons:image-composition',
    title: 'Crisp on Every Screen',
    description:
      'The same sharp grid from your phone or desktop. Download it, copy it, or share it in a tap.',
  },
  {
    icon: 'hugeicons:left-to-right-list-bullet',
    title: 'Text for the Threads',
    description:
      'Prefer words? Grab a ready-to-paste list for Discord and Reddit, or plain text for everywhere else.',
  },
]

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

// Shown once the wishlist has items, until dismissed.
const dragHintSeen = useCookie('wishlist-drag-hint-seen', {
  default: () => false,
  maxAge: 60 * 60 * 24 * 365,
})

const hasCollection = computed(() => !!tradingCfg.value.buying.collection)

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
