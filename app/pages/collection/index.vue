<template>
  <UDashboardPanel v-if="authenticated" id="collection">
    <template #header>
      <UDashboardNavbar title="My Collection" />
    </template>

    <template #body>
      <UPageHeader
        headline="Collection"
        title="My Collection"
        description="Every shelf you keep, hunt for, or trade from, grouped by catalog."
        :ui="listingPageHeaderUi"
      >
        <template #links>
          <UModal v-model:open="adding" title="Add Collection">
            <UButton
              color="primary"
              icon="hugeicons:bookmark-add-02"
              label="Add Collection"
            />

            <template #body="{ close }">
              <CollectionModalCollectionForm @on-success="close" />
            </template>
          </UModal>
        </template>
      </UPageHeader>

      <template v-if="groupedCollections.length">
        <SharedSpecList :items="summary" />

        <section
          v-for="group in groupedCollections"
          :key="group.value"
          class="space-y-4 pt-4"
        >
          <UPageHeader
            :title="`${group.label} Collections`"
            :description="countLabel(group.items.length, 'collection')"
            :as="detailSectionHeaderAs"
            :ui="detailSectionHeaderUi"
          />

          <UPageGrid class="gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            <UPageCard
              v-for="collection in group.items"
              :key="collection.id"
              :to="`/collection/${collection.category}/${collection.id}`"
              :title="collection.name"
              :description="countLabel(collection.total_items || 0, 'item')"
              :icon="collectionIcon(collection)"
              variant="subtle"
              spotlight
              :ui="{
                root: 'h-full',
                container: 'h-full',
                leadingIcon: 'size-6 text-primary',
                title: 'truncate',
                footer: 'mt-auto',
              }"
            >
              <template #footer>
                <UBadge
                  v-if="intentLabel(collection)"
                  :label="intentLabel(collection)"
                  variant="outline"
                />
                <UBadge
                  :label="collection.published ? 'Public' : 'Private'"
                  :icon="
                    collection.published ? 'hugeicons:global' : 'hugeicons:locked'
                  "
                  :color="collection.published ? 'primary' : undefined"
                  variant="soft"
                />
              </template>
            </UPageCard>
          </UPageGrid>
        </section>
      </template>

      <UEmpty
        v-else
        icon="hugeicons:collections-bookmark"
        title="An Empty Shelf, Full of Potential"
        description="Create a collection to start showing off your keebs."
        :actions="[
          {
            label: 'Add Collection',
            icon: 'hugeicons:bookmark-add-02',
            ui: { label: 'block' },
            onClick: () => (adding = true),
          },
        ]"
      />
    </template>
  </UDashboardPanel>
  <SharedProtectedPage
    v-else
    icon="hugeicons:archive-02"
    title="Your Keeb Shelf Awaits"
    description="Artisans, keysets, and keyboards: track every piece you own, hunt, or want to let go, all in one shelf."
    :features="signedOutFeatures"
    :nav-title="meta.title"
    sign-in-label="Sign In to Start Collecting"
  />
</template>

<script setup>
import { Constants } from '~/types/database.types'

const meta = {
  title: 'My Collection',
  description:
    'Manage and showcase your personal artisan, keycap, and keyboard collections in one place.',
}

useSeoMeta(meta)

const signedOutFeatures = [
  {
    icon: 'hugeicons:folder-library',
    title: 'Shelves for Everything',
    description:
      'Sort your artisans, keysets, and keyboards into as many collections as you like.',
  },
  {
    icon: 'hugeicons:target-02',
    title: 'Keep, Hunt, or Let Go',
    description:
      'Make each artisan collection a shelf of caps you own, a wishlist, or caps for sale or trade.',
  },
  {
    icon: 'hugeicons:store-01',
    title: 'Trade Without the Spreadsheet',
    description:
      'Publish your want and sell lists to the Trading Hub, or turn them into a wishlist image in a few clicks.',
  },
]

const userStore = useUserStore()
const { authenticated, user, collections } = storeToRefs(userStore)

onBeforeMount(() => {
  if (authenticated.value) userStore.fetchUserCollections(user.value.uid)
})

const adding = ref(false)

const modules = Constants.public.Enums.module.map((module) => ({
  label: module,
  value: module.toLowerCase(),
}))

// What an artisan collection is for; other catalogs have no intent
const intentLabel = (collection) =>
  collection.category === 'artisan'
    ? collectionIntentItems.find((item) => item.value === collection.intent)
        ?.label
    : ''

const collectionIcon = (collection) =>
  (collection.category === 'artisan' && TRADE_INTENTS[collection.intent]?.icon) ||
  KEEB_MODULE_ICONS[collection.category] ||
  'hugeicons:folder-library'

const summary = computed(() => [
  {
    term: 'Collections',
    icon: 'hugeicons:folder-library',
    description: formatNumber(collections.value.length),
  },
  {
    term: 'Items',
    icon: 'hugeicons:package',
    description: formatNumber(
      collections.value.reduce((sum, c) => sum + (c.total_items || 0), 0),
    ),
  },
  {
    term: 'Public',
    icon: 'hugeicons:global',
    description: formatNumber(
      collections.value.filter((c) => c.published).length,
    ),
  },
])

const groupedCollections = computed(() =>
  modules
    .map((module) => ({
      ...module,
      items: collections.value.filter((c) => c.category === module.value),
    }))
    .filter((module) => module.items.length),
)
</script>
