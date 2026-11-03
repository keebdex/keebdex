<template>
  <UDashboardPanel v-if="authenticated" id="wishlist-preview">
    <template #header>
      <UDashboardNavbar title="Wishlist Preview">
        <template #right>
          <ArtisanWishlistTips v-if="hasCollection" :total-items="totalItems" />

          <UButton
            v-if="totalItems"
            icon="hugeicons:image-download-02"
            @click="shareOpen = true"
          >
            Save & Share
          </UButton>

          <!-- The settings sit beside the sheet from lg up; below it they open
          in a slideover. Before a collection is picked, the start screen
          holds the picker. -->
          <UButton
            v-if="hasCollection"
            icon="hugeicons:settings-02"
            aria-label="Wishlist Settings"
            class="lg:hidden"
            @click="sidebarOpen = true"
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
        @reorder="saveOrder"
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
      <!-- No collection picked yet: pick one right here -->
      <ArtisanWishlistStart v-else />
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
import { groupBy } from 'es-toolkit'
import { sortBy } from 'es-toolkit/compat'

const { isMobile } = useDevice()
const toast = useToast()

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
const sidebarOpen = useWishlistSidebar()

const { data: collections, refresh } = await useAsyncData(
  // Guests have no collections: skip the request instead of asking the API
  // for user "undefined"
  () =>
    user.value.uid
      ? $fetch(`/api/users/${user.value.uid}/collection-items`).catch(() => [])
      : Promise.resolve([]),
  {
    watch: [user],
    // Sorting first keeps each collection's items in order once grouped
    transform: (data) =>
      groupBy(sortBy(data, ['order', 'id']), (item) => item.collection_id),
  },
)

const buyingItems = ref([])
const sellingItems = ref([])

// Copies: dragging reorders these in place, while `collections` keeps every
// item of a collection, removed ones included, in its saved order
watchEffect(() => {
  buyingItems.value = [
    ...(collections.value[tradingCfg.value.buying.collection] || []),
  ]
  sellingItems.value = [
    ...(collections.value[tradingCfg.value.selling.collection] || []),
  ]
})

const hasCollection = computed(() => !!tradingCfg.value.buying.collection)

// Caps on the sheet: Have only counts on a trading list
const totalItems = computed(
  () =>
    buyingItems.value.length +
    (tradingCfg.value.type === 'trading' ? sellingItems.value.length : 0),
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

// A drag saves the collection's order, so the image opens in it next time.
// Removing stays temporary: a removed cap keeps following the cap that was
// just before it, and comes back there when the list is opened again.
const saveOrder = (visible) => {
  const collectionId = visible[0]?.collection_id
  const all = sortBy(collections.value[collectionId] || [], ['order', 'id'])
  const shown = new Set(visible.map(({ id }) => id))

  // Removed caps grouped by the shown cap before them (null: at the top)
  const followers = new Map()
  let anchor = null
  for (const item of all) {
    if (shown.has(item.id)) {
      anchor = item.id
    } else {
      followers.set(anchor, [...(followers.get(anchor) || []), item])
    }
  }

  const ordered = [
    ...(followers.get(null) || []),
    ...visible.flatMap((item) => [item, ...(followers.get(item.id) || [])]),
  ]
  const changed = ordered
    .map((item, order) => ({ item, order }))
    .filter(({ item, order }) => item.order !== order)

  if (!changed.length) return

  // Kept on the items so the next drag starts from the saved order
  changed.forEach(({ item, order }) => (item.order = order))

  $fetch(`/api/users/${user.value.uid}/collections/${collectionId}/sort`, {
    method: 'post',
    body: changed.map(({ item, order }) => ({ id: item.id, order })),
  }).catch((error) => toast.add(errorToast(error)))
}

const snapshot = useTemplateRef('snapshot')
const filename = computed(() => `wishlist-${tradingCfg.value.type}`)

const capture = () => snapshot.value.capture()

const shareOpen = ref(false)

const textSections = computed(() =>
  wishlistSections(tradingCfg.value, buyingItems.value, sellingItems.value),
)
</script>
