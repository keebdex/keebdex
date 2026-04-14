<template>
  <UDashboardPanel :id="`collection-${route.params.collection}`">
    <template #header>
      <UDashboardNavbar :title="data?.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="authenticated"
            v-model:visible="visible.edit"
            title="Edit Collection"
          >
            <UButton icon="hugeicons:bookmark-02" label="Edit" />

            <template #body="{ close }">
              <CollectionModalCollectionForm
                :metadata="data"
                :is-edit="true"
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>

          <UModal
            v-model:visible="visible.delete"
            title="Delete Collection"
            :description="`Are you sure you want to delete ${data?.name}?`"
            :ui="{ footer: 'justify-end', content: 'divide-none' }"
          >
            <UButton
              v-if="authenticated"
              label="Delete"
              icon="hugeicons:bookmark-remove-02"
              color="error"
            />

            <template #footer="{ close }">
              <UButton label="Cancel" @click="close" />
              <UButton label="Delete" color="error" @click="deleteCollection" />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid
        v-if="sortedCollections.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-6 gap-4"
      >
        <UPageCard
          v-for="{ id, keyset } in sortedCollections"
          :key="keyset.id"
          :title="keyset.name"
          :description="keyset.designer"
          variant="subtle"
          reverse
        >
          <NuxtImg
            loading="lazy"
            :alt="keyset.name"
            :src="keyset.img || keyset.render_img"
            class="aspect-[16/9] w-full object-cover"
          />

          <template #footer>
            <SharedSaveToCollection
              category="keyset"
              label="Move"
              :item="{ id, keyset }"
              :move="true"
              icon="hugeicons:move-to"
              @on-select="moveTo"
            />

            <UModal
              v-model:visible="visible.remove"
              title="Remove Keyset"
              :description="`Are you sure you want to remove ${keyset.name}?`"
              :ui="{ footer: 'justify-end', content: 'divide-none' }"
            >
              <UButton
                label="Remove"
                icon="hugeicons:bookmark-minus-02"
                color="error"
              />

              <template #footer="{ close }">
                <UButton label="Cancel" @click="close" />
                <UButton
                  label="Delete"
                  color="error"
                  @click="removeItem(id, keyset.name)"
                />
              </template>
            </UModal>
          </template>
        </UPageCard>
      </UPageGrid>

      <UPageSection
        v-else-if="status === 'success'"
        icon="hugeicons:grid-view"
        title="No Keysets Yet"
        description="Save keysets from their respective pages to start building this collection."
        class="mx-auto"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
import sortBy from 'lodash.sortby'

const route = useRoute()

const { authenticated } = storeToRefs(useUserStore())
const { data, status, refresh, deleteCollection } = useCollection(
  () => route.params.collection,
)
const { moveItem, removeItem } = useCollectionItem(
  () => route.params.collection,
  refresh,
)

const moveTo = (collection, item) => {
  moveItem(collection, item.id, item.keyset.name)
}

useSeoMeta({
  title: data.value?.name ? `${data.value.name} • Collection` : 'Collection',
})

const breadcrumbs = computed(() => {
  return [
    {
      label: 'My Collection',
      icon: 'hugeicons:collections-bookmark',
      to: '/collection',
    },
    {
      label: data.value?.name,
    },
  ]
})

const sortedCollections = computed(() => {
  return sortBy(data.value?.items || [], ['keyset.name'])
})

const visible = ref({
  edit: false,
  delete: false,
  remove: false,
})
</script>
