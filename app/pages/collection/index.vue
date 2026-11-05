<template>
  <UDashboardPanel v-if="authenticated" id="collection">
    <template #header>
      <UDashboardNavbar title="Collection" />
    </template>

    <template #body>
      <UPageHeader
        title="My Collection"
        description="Every shelf you keep, hunt for, or trade from, grouped by catalog."
        :ui="listingPageHeaderUi"
      >
        <template #links>
          <UModal v-model:open="adding" title="Add Collection">
            <UButton
              color="primary"
              icon="solar:bookmark-plus-line-duotone"
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

          <UPageGrid
            class="gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
          >
            <UPageCard
              v-for="collection in group.items"
              :key="collection.id"
              :to="`/collection/${collection.category}/${collection.id}`"
              :title="collection.name"
              reverse
              spotlight
              :ui="{
                root: 'h-full flex flex-col',
                container: imageCardContainerClass,
                body: 'w-full',
                title: 'truncate',
              }"
            >
              <!-- A peek at the shelf: its first photos, one to four tiles -->
              <div class="aspect-video overflow-hidden rounded bg-elevated">
                <div
                  v-if="collection.images?.length"
                  class="grid h-full gap-0.5"
                  :class="mosaicClass(collection.images.length)"
                >
                  <NuxtImg
                    v-for="(src, index) in collection.images"
                    :key="index"
                    :src="src"
                    :alt="collection.name"
                    sizes="xs:46vw sm:22vw lg:15vw 2xl:11vw 3xl:192px"
                    loading="lazy"
                    decoding="async"
                    class="h-full w-full object-cover"
                    :class="
                      collection.images.length === 3 &&
                      index === 0 &&
                      'row-span-2'
                    "
                  />
                </div>
                <div
                  v-else
                  class="flex h-full flex-col items-center justify-center gap-2 text-dimmed"
                >
                  <UIcon
                    :name="KEEB_MODULE_ICONS[collection.category]"
                    class="size-10"
                  />
                  <span class="text-sm">Nothing here yet</span>
                </div>
              </div>

              <!-- Who can see it, then a tag on wishlists and sale lists (a
                   shelf you keep is the default and needs none) -->
              <template #description>
                <div class="flex items-center gap-2 text-sm font-medium">
                  <span
                    class="inline-flex items-center gap-1.5"
                    :class="
                      collection.published ? 'text-primary' : 'text-muted'
                    "
                  >
                    <UIcon
                      :name="
                        collection.published
                          ? 'solar:global-line-duotone'
                          : 'solar:lock-line-duotone'
                      "
                      class="size-4"
                    />
                    {{ collection.published ? 'Public' : 'Private' }}
                  </span>

                  <UBadge
                    v-if="
                      collection.category === 'artisan' &&
                      INTENTS[collection.intent]
                    "
                    v-bind="INTENTS[collection.intent]"
                    variant="subtle"
                    class="ms-auto"
                  />
                </div>
              </template>
            </UPageCard>
          </UPageGrid>
        </section>
      </template>

      <UEmpty
        v-else
        icon="solar:bookmark-square-bold-duotone"
        title="An Empty Shelf, Full of Potential"
        description="Create a collection to start showing off your keebs."
      />
    </template>
  </UDashboardPanel>
  <SharedProtectedPage
    v-else
    icon="solar:archive-bold-duotone"
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
    icon: 'solar:library-bold-duotone',
    title: 'Shelves for Everything',
    description:
      'Sort your artisans, keysets, and keyboards into as many collections as you like.',
  },
  {
    icon: 'solar:target-bold-duotone',
    title: 'Keep, Hunt, or Let Go',
    description:
      'Make each artisan collection a shelf of caps you own, a wishlist, or caps for sale or trade.',
  },
  {
    icon: 'solar:shop-bold-duotone',
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

// Tags of artisan wishlists and sale lists, in the Trading Hub's colors and
// icons
const INTENTS = {
  want: { ...TRADE_INTENTS.want, label: 'Wishlist' },
  sell: { ...TRADE_INTENTS.sell, label: 'For Sale or Trade' },
}

// One photo fills the cover, two sit side by side, three put the first
// beside the other two, four make a 2x2 grid
const mosaicClass = (count) =>
  count === 1
    ? 'grid-cols-1'
    : count === 2
      ? 'grid-cols-2'
      : 'grid-cols-2 grid-rows-2'

const groupedCollections = computed(() =>
  modules
    .map((module) => ({
      ...module,
      items: collections.value.filter((c) => c.category === module.value),
    }))
    .filter((module) => module.items.length),
)
</script>
