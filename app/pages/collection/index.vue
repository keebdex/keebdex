<template>
  <UDashboardPanel v-if="authenticated" id="collection">
    <template #header>
      <UDashboardNavbar title="My Collection">
        <template #right>
          <USelect
            v-model="category"
            :items="categories"
            value-key="value"
            class="w-40"
          />

          <UModal v-model:visible="visible" title="Add Collection">
            <UButton
              v-if="authenticated"
              color="primary"
              icon="hugeicons:bookmark-add-02"
              label="Add"
            />

            <template #body="{ close }">
              <CollectionModalCollectionForm
                :uid="user.uid"
                @on-success="close"
              />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
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

const category = ref('artisan')
const categories = ref(
  Constants.public.Enums.module.map((module) => ({
    label: module,
    value: module.toLowerCase(),
  })),
)

const selectedCollections = computed(() =>
  collections.value.filter((c) => c.category === category.value),
)
</script>
