<template>
  <UDashboardPanel :id="`collection-${route.params.collection}`">
    <template #header>
      <UDashboardNavbar :title="data?.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="isOwner"
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
          >
            <UButton
              v-if="isOwner"
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
      <UPageGrid v-if="sortedCollections.length">
        <SharedCatalogCard
          v-for="{ id, keyboard } in sortedCollections"
          :key="id"
          :title="keyboard.variant_name"
          :description="
            formatKeyboardDescription([
              keyboard?.brand?.name,
              keyboard?.release?.keyboard?.name,
              keyboard?.release?.name,
            ])
          "
          :img="keyboard.img_front || keyboard.img_back"
          fallback="/keyboard.png"
          :to="
            keyboard.release?.brand_keyboard_slug
              ? `/keyboard/brand/${keyboard.release.brand_keyboard_slug}`
              : undefined
          "
        >
          <template v-if="isOwner" #footer-start>
            <SharedSaveToCollection
              category="keyboard"
              label="Move"
              keep-label
              :item="{ id, keyboard }"
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
                :aria-label="`Remove ${keyboard.variant_name}`"
                @click="confirmRemove(id, keyboard)"
              />
            </UTooltip>
          </template>
        </SharedCatalogCard>
      </UPageGrid>

      <SharedConfirmModal
        v-model:open="removing.open"
        title="Remove Keyboard"
        :description="`Are you sure you want to remove ${removing.name}?`"
        confirm-label="Remove"
        @confirm="remove"
      />

      <UEmpty
        v-if="!sortedCollections.length && status === 'success'"
        icon="hugeicons:keyboard"
        title="No Boards on the Bench"
        description="Save keyboard variants from their pages to fill this collection."
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { sortBy } from 'es-toolkit/compat'

const route = useRoute()

const { data, status, refresh, deleteCollection, isOwner } = useCollection(
  () => route.params.collection,
)
const { moveItem, removeItem } = useCollectionItem(
  () => route.params.collection,
  refresh,
)

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
  return sortBy(data.value?.items || [], ['keyboard.variant_name'])
})

const moveTo = (collection, { id, keyboard }) => {
  const contextName = formatKeyboardDescription([
    keyboard?.brand?.name,
    keyboard?.release?.keyboard?.name,
    keyboard?.release?.name,
    keyboard?.variant_name,
  ])

  moveItem(collection, id, contextName)
}

// One confirm dialog for removing any item
const removing = reactive({ open: false, id: null, name: '' })

const confirmRemove = (id, keyboard) => {
  const name = formatKeyboardDescription([
    keyboard?.brand?.name,
    keyboard?.release?.keyboard?.name,
    keyboard?.release?.name,
    keyboard?.variant_name,
  ])

  Object.assign(removing, { open: true, id, name })
}

const remove = () => {
  removing.open = false
  removeItem(removing.id, removing.name, 'Keyboard')
}

const visible = ref({
  edit: false,
  delete: false,
})
</script>
