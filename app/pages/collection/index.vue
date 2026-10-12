<template>
  <UDashboardPanel v-if="authenticated" id="collection">
    <template #header>
      <UDashboardNavbar title="My Collection">
        <template #right>
          <UModal v-model:visible="visible" title="Add Collection">
            <UButton
              v-if="authenticated"
              color="primary"
              icon="hugeicons:bookmark-add-02"
              label="Add"
            />

            <template #body="{ close }">
              <CollectionModalCollectionForm @on-success="close" />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageList v-if="groupedCollections.length" divide>
        <UPageCard
          v-for="(group, idx) in groupedCollections"
          :key="group.value"
          :title="group.label"
          variant="ghost"
          :ui="{
            container: `!px-0 ${idx === 0 ? 'first:pt-0' : ''}`,
          }"
        >
          <UPageGrid>
            <UPageCard
              v-for="collection in group.items"
              v-bind="collection"
              :key="collection.id"
              :to="`/collection/${collection.category}/${collection.id}`"
              :title="collection.name"
              :description="`${collection.total_items} items`"
              :icon="
                collection.published ? 'hugeicons:global' : 'hugeicons:locked'
              "
              variant="subtle"
              :ui="{
                leadingIcon: !collection.published && 'text-dimmed',
              }"
            />
          </UPageGrid>
        </UPageCard>
      </UPageList>
      <UEmpty
        v-else
        icon="hugeicons:collections-bookmark"
        title="An Empty Shelf, Full of Potential"
        description="Create a collection to start showing off your keebs."
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

const visible = ref(false)

const modules = Constants.public.Enums.module.map((module) => ({
  label: module,
  value: module.toLowerCase(),
}))

const groupedCollections = computed(() =>
  modules
    .map((module) => ({
      ...module,
      items: collections.value.filter((c) => c.category === module.value),
    }))
    .filter((module) => module.items.length),
)
</script>
