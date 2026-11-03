<template>
  <UDashboardPanel :id="`collection-${route.params.collection}`">
    <template #header>
      <SharedBreadcrumbNavbar :items="breadcrumbs" />
    </template>

    <template #body>
      <UPageHeader
        :title="data?.name"
        :description="data?.message"
        :ui="detailPageHeaderUi(false)"
      >
        <template v-if="isOwner" #links>
          <UModal
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
            title="Delete Collection"
            :description="`Are you sure you want to delete ${data?.name}?`"
          >
            <UButton
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
      </UPageHeader>

      <UPageGrid v-if="sortedCollections.length">
        <SharedCatalogCard
          v-for="{ id, keyset } in sortedCollections"
          :key="keyset.id"
          :title="keyset.name"
          :description="keyset.designer"
          :img="keyset.img"
          fallback="/keyset.png"
          :to="`/keyset/${keyset.profile_keyset_id}`"
        >
          <template v-if="isOwner" #footer-start>
            <SharedSaveToCollection
              category="keyset"
              :item="{ id, keyset }"
              :move="true"
              icon="hugeicons:move-to"
              @on-select="moveTo"
            />
          </template>

          <template v-if="isOwner" #footer-end>
            <UTooltip text="Remove">
              <UButton
                icon="hugeicons:bookmark-minus-02"
                color="error"
                variant="ghost"
                :aria-label="`Remove ${keyset.name}`"
                @click="confirmRemove(id, keyset.name)"
              />
            </UTooltip>
          </template>
        </SharedCatalogCard>
      </UPageGrid>

      <UEmpty
        v-else-if="status === 'success'"
        icon="hugeicons:grid-view"
        title="Not a Single Keycap Here"
        description="Save keysets from their pages to start building this collection."
      />

      <SharedConfirmModal
        v-model:open="removing.open"
        title="Remove Keyset"
        :description="`Are you sure you want to remove ${removing.name}?`"
        confirm-label="Remove"
        @confirm="confirmRemoval"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { sortBy } from 'es-toolkit/compat'

const route = useRoute()

const { data, status, refresh, deleteCollection, isOwner } = useCollection(
  () => route.params.collection,
  'keyset',
)
const { moveItem, removing, confirmRemove, confirmRemoval } = useCollectionItem(
  () => route.params.collection,
  refresh,
)

const moveTo = (collection, item) => {
  moveItem(collection, item.id, item.keyset.name)
}

const breadcrumbs = computed(() => {
  return [
    {
      label: 'My Collection',
      icon: 'hugeicons:collections-bookmark',
      to: '/collection',
    },
  ]
})

const sortedCollections = computed(() => {
  return sortBy(data.value?.items || [], ['keyset.name'])
})
</script>
