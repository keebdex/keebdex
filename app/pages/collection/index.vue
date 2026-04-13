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
                collection.published ? 'hugeicons:face-id' : 'hugeicons:locked'
              "
              variant="subtle"
              :ui="{
                leadingIcon: !collection.published && 'text-dimmed',
              }"
            />
          </UPageGrid>
        </UPageCard>
      </UPageList>
      <UAlert
        v-else
        title="No collections yet"
        description="Create a collection to organize and showcase your items."
        icon="hugeicons:information-circle"
        color="neutral"
        variant="soft"
      />
    </template>
  </UDashboardPanel>
  <SharedProtectedPage
    v-else
    icon="hugeicons:collections-bookmark"
    :title="meta.title"
    :description="meta.description"
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

const userStore = useUserStore()
const { authenticated, user, collections } = storeToRefs(userStore)

onBeforeMount(() => {
  userStore.fetchUserCollections(user.value.uid)
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
