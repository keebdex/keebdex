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
          <CollectionHeaderActions
            :collection="data"
            @updated="refresh"
            @delete="deleteCollection"
          />
        </template>
      </UPageHeader>

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
                @click="confirmRemove(id, variantName(keyboard), 'Keyboard')"
              />
            </UTooltip>
          </template>
        </SharedCatalogCard>
      </UPageGrid>

      <UEmpty
        v-else-if="status === 'success'"
        icon="hugeicons:keyboard"
        title="No Boards on the Bench"
        description="Save keyboard variants from their pages to fill this collection."
      />

      <SharedConfirmModal
        v-model:open="removing.open"
        title="Remove Keyboard"
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
  'keyboard',
)
const { moveItem, removing, confirmRemove, confirmRemoval } = useCollectionItem(
  () => route.params.collection,
  refresh,
)

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
  return sortBy(data.value?.items || [], ['keyboard.variant_name'])
})

// Brand, keyboard, release, and variant, as toasts and the dialog name it
const variantName = (keyboard) =>
  formatKeyboardDescription([
    keyboard?.brand?.name,
    keyboard?.release?.keyboard?.name,
    keyboard?.release?.name,
    keyboard?.variant_name,
  ])

const moveTo = (collection, { id, keyboard }) => {
  moveItem(collection, id, variantName(keyboard))
}
</script>
