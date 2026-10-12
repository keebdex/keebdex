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
        <UPageCard
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
          variant="subtle"
          reverse
        >
          <NuxtImg
            preset="cover"
            loading="lazy"
            decoding="async"
            :alt="keyboard.variant_name"
            :src="keyboard.img_front || keyboard.img_back || '/keyboard.png'"
            class="aspect-[16/9] w-full object-cover"
          />

          <template v-if="isOwner" #footer>
            <SharedSaveToCollection
              category="keyboard"
              label="Move"
              :item="{ id, keyboard }"
              :move="true"
              icon="hugeicons:move-to"
              @on-select="moveTo"
            />

            <UModal
              v-model:visible="visible.remove"
              title="Remove Keyboard"
              :description="`Are you sure you want to remove ${formatKeyboardDescription([keyboard?.brand?.name, keyboard?.release?.keyboard?.name, keyboard?.release?.name, keyboard?.variant_name])}?`"
            >
              <UButton
                label="Remove"
                icon="hugeicons:bookmark-minus-02"
                color="error"
              />

              <template #footer="{ close }">
                <UButton label="Cancel" @click="close" />
                <UButton
                  label="Remove"
                  color="error"
                  @click="remove(id, keyboard)"
                />
              </template>
            </UModal>
          </template>
        </UPageCard>
      </UPageGrid>

      <UEmpty
        v-else-if="status === 'success'"
        icon="hugeicons:keyboard"
        title="No Boards on the Bench"
        description="Save keyboard variants from their pages to fill this collection."
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
import sortBy from 'lodash.sortby'

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

const remove = (id, keyboard) => {
  const contextName = formatKeyboardDescription([
    keyboard?.brand?.name,
    keyboard?.release?.keyboard?.name,
    keyboard?.release?.name,
    keyboard?.variant_name,
  ])
  removeItem(id, contextName, 'Keyboard')
}

const visible = ref({
  edit: false,
  delete: false,
  remove: false,
})
</script>
