<template>
  <UDashboardPanel v-if="authenticated" id="collection">
    <template #header>
      <UDashboardNavbar title="My Collection">
        <template #right>
          <UTabs
            v-if="$device.isDesktopOrTablet"
            v-model="category"
            :items="categories"
            :content="false"
          />

          <UModal v-model:visible="visible" title="Add Collection">
            <UButton
              v-if="authenticated"
              color="primary"
              icon="hugeicons:bookmark-add-01"
            >
              Add
            </UButton>

            <template #body="{ close }">
              <ModalCollectionForm :uid="user.uid" @on-success="close" />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="$device.isMobile">
        <UTabs
          v-model="category"
          :items="categories"
          :content="false"
          class="w-full"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageGrid>
        <UPageCard
          v-for="collection in selectedCollections"
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
    </template>
  </UDashboardPanel>
  <ProtectedPage
    v-else
    icon="hugeicons:collections-bookmark"
    :title="meta.title"
    :description="meta.description"
  />
</template>

<script setup>
const meta = {
  title: 'My Collection',
  description:
    'Manage and showcase your personal keycap and artisan collection in one place.',
}

useSeoMeta(meta)

const userStore = useUserStore()
const { authenticated, user, collections } = storeToRefs(userStore)

onBeforeMount(() => {
  userStore.fetchUserCollections(user.value.uid)
})

const visible = ref(false)

const category = ref('artisan')
const categories = ref([
  { label: 'Artisan', value: 'artisan' },
  { label: 'Keycap', value: 'keycap' },
])

const selectedCollections = computed(() =>
  collections.value.filter((c) => c.category === category.value),
)
</script>
