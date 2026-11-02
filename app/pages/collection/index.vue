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
        <section
          v-for="group in groupedCollections"
          :key="group.value"
          class="space-y-4 pt-4"
        >
          <UPageHeader
            :title="`${group.label} Collections`"
            :as="detailSectionHeaderAs"
            :ui="detailSectionHeaderUi"
          />

          <UPageGrid class="gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            <UPageCard
              v-for="collection in group.items"
              :key="collection.id"
              :to="`/collection/${collection.category}/${collection.id}`"
              :title="collection.name"
              :icon="KEEB_MODULE_ICONS[collection.category]"
              variant="subtle"
              spotlight
              :ui="{
                root: 'h-full',
                container: 'h-full',
                leadingIcon: 'size-6 text-primary',
                title: 'truncate',
                footer: 'mt-auto items-center justify-between',
              }"
            >
              <template #footer>
                <span class="font-mono text-sm tabular-nums text-muted">
                  {{ countLabel(collection.total_items || 0, 'item') }}
                </span>

                <div class="flex flex-wrap items-center gap-1.5">
                  <UBadge
                    v-for="tag in collectionTags(collection)"
                    :key="tag.label"
                    v-bind="tag"
                    variant="subtle"
                    size="sm"
                  />
                </div>
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

// What an artisan collection is for (other catalogs have no intent), then
// whether it is shared
const INTENT_TAGS = {
  keep: { label: 'My Collection', icon: 'hugeicons:archive-02' },
  want: { label: 'Wishlist', icon: TRADE_INTENTS.want.icon, color: TRADE_INTENTS.want.color },
  sell: { label: 'For Sale or Trade', icon: TRADE_INTENTS.sell.icon, color: TRADE_INTENTS.sell.color },
}

const collectionTags = (collection) =>
  [
    collection.category === 'artisan' && INTENT_TAGS[collection.intent],
    collection.published
      ? { label: 'Public', icon: 'hugeicons:global', color: 'primary' }
      : { label: 'Private', icon: 'hugeicons:locked' },
  ].filter(Boolean)

const groupedCollections = computed(() =>
  modules
    .map((module) => ({
      ...module,
      items: collections.value.filter((c) => c.category === module.value),
    }))
    .filter((module) => module.items.length),
)
</script>
