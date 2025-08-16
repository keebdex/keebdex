<template>
  <UDashboardPanel id="collection">
    <template #header>
      <UDashboardNavbar title="My Collections">
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
              icon="hugeicons:bookmark-add-02"
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
            collection.published
              ? 'i-hugeicons-global-search'
              : 'i-hugeicons-square-lock-02'
          "
          variant="subtle"
        />
      </UPageGrid>
    </template>
  </UDashboardPanel>
</template>

<script setup>
useSeoMeta({
  title: 'My Collections',
})

definePageMeta({
  middleware: 'auth',
})

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
