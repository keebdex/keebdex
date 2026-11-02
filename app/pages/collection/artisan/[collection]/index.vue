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
            v-model:visible="visible.share"
            title="Share Collection"
            description="Control the visibility of this collection and generate a shareable link if needed."
          >
            <UButton icon="hugeicons:share-03" label="Share" />

            <template #body>
              <URadioGroup
                v-model="shareOption"
                variant="table"
                indicator="end"
                :items="shareItems"
              />
            </template>

            <template v-if="shareOption === 'public'" #footer>
              <UInput :model-value="shareUrl" readonly class="flex-1" />
              <UButton
                label="Copy Link"
                icon="hugeicons:copy-link"
                loading-auto
                @click="copyShareUrl"
              />
            </template>
            <template
              v-else-if="shareOption === 'private' && data?.published"
              #footer="{ close }"
            >
              <UButton label="Cancel" variant="ghost" @click="close" />
              <UButton
                label="Make Private"
                color="error"
                loading-auto
                @click="saveShareOption(close)"
              />
            </template>
          </UModal>

          <UButton
            v-if="isOwner"
            :icon="appConfig.ui.icons.sortManual"
            label="Manual Sort"
            :to="`/collection/artisan/${route.params.collection}/sort`"
          />

          <UModal
            v-if="isOwner"
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
      <UAlert
        v-if="hasOutdated"
        description="Outdated items found during database sync. Please remove and re-add from the maker page if needed before deletion."
        icon="hugeicons:user-warning-01"
        color="warning"
      />

      <UPageGrid v-if="sortedCollections.length" :class="artisanGridClass">
        <SharedCatalogCard
          v-for="{ artisan, ...rest } in sortedCollections"
          :key="rest.id"
          :title="artisan.name"
          :description="artisan?.sculpt?.name"
          :img="artisan.img"
          fallback="/artisan.png"
          aspect="square"
          :dimmed="(listing && !rest.exchange) || artisan.deleted"
          :highlight="rest.priority"
          :to="
            artisan.deleted
              ? undefined
              : `/artisan/maker/${artisan.maker_sculpt_id}?cid=${artisan.colorway_id}`
          "
        >
          <!-- Found (wishlist) or sold (for sale) -->
          <template v-if="listing && !rest.exchange" #badges>
            <span class="absolute inset-0 flex items-center justify-center">
              <UIcon
                v-if="buying"
                name="hugeicons:tick-double-02"
                class="text-success text-9xl"
              />
              <UIcon
                v-else
                name="hugeicons:unavailable"
                class="text-error text-9xl"
              />
            </span>
          </template>

          <template v-if="isOwner" #footer-start>
            <UButton
              v-if="artisan.deleted"
              icon="hugeicons:clean"
              color="warning"
              label="Clear Outdated"
              :ui="{ label: 'block' }"
              @click="remove(rest.id, artisan)"
            />
            <SharedSaveToCollection
              v-else
              :item="{ ...rest, artisan }"
              label="Move"
              keep-label
              :move="true"
              icon="hugeicons:move-to"
              @on-select="moveTo"
            />
          </template>

          <template v-if="isOwner && !artisan.deleted" #footer-end>
            <UTooltip v-if="listing" text="Edit Listing">
              <UButton
                icon="hugeicons:edit-01"
                variant="ghost"
                :aria-label="`Edit ${colorwayTitle(artisan)} listing`"
                @click="editListing({ ...rest, artisan })"
              />
            </UTooltip>

            <UTooltip text="Remove">
              <UButton
                icon="hugeicons:bookmark-minus-02"
                color="error"
                variant="ghost"
                :aria-label="`Remove ${colorwayTitle(artisan)}`"
                @click="confirmRemove(rest.id, colorwayTitle(artisan))"
              />
            </UTooltip>
          </template>
        </SharedCatalogCard>
      </UPageGrid>

      <UEmpty
        v-else-if="status === 'success'"
        icon="hugeicons:alien-01"
        title="No Artisans Have Moved In Yet"
        description="Save artisans from their pages and they will settle in right here."
      />

      <template v-if="isOwner">
        <UModal
          v-model:open="listingItem.open"
          :title="`Edit ${listingItem.name} Listing`"
        >
          <template #body>
            <CollectionModalCollectionItemForm
              :metadata="listingItem.item"
              :buying="buying"
              @on-success="
                () => {
                  listingItem.open = false
                  refresh()
                }
              "
            />
          </template>
        </UModal>

        <SharedConfirmModal
          v-model:open="removing.open"
          title="Remove Artisan"
          :description="`Are you sure you want to remove ${removing.name}?`"
          confirm-label="Remove"
          @confirm="confirmRemoval"
        />
      </template>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { sortBy } from 'es-toolkit/compat'

const appConfig = useAppConfig()
const config = useRuntimeConfig()
const route = useRoute()
const toast = useToast()

const { data, status, refresh, deleteCollection, isOwner } = useCollection(
  () => route.params.collection,
  'artisan keycap',
)

const { removeItem, moveItem, removing, confirmRemove, confirmRemoval } =
  useCollectionItem(
  () => route.params.collection,
  refresh,
)

// Wishlist and for-sale collections track per-item status and prices
const listing = computed(() => ['want', 'sell'].includes(data.value?.intent))
const buying = computed(() => data.value?.intent === 'want')

const shareUrl = computed(() => config.public.site.homepage + route.fullPath)
const shareOption = ref('private')
const shareItems = computed(() => [
  {
    label: 'Keep Private',
    description: 'Only you have access',
    value: 'private',
    icon: 'hugeicons:locked',
  },
  {
    label: 'Create Public Link',
    description: listing.value
      ? 'Anyone with the link can view, and it is listed in the Trading Hub'
      : 'Anyone with the link can view',
    value: 'public',
    icon: 'hugeicons:global',
  },
])

const visible = ref({
  share: false,
})

// One listing form for every item
const listingItem = reactive({ open: false, name: '', item: null })

const editListing = ({ artisan, ...item }) => {
  Object.assign(listingItem, {
    open: true,
    name: colorwayTitle(artisan),
    item,
  })
}


// Sync shareOption with saved state whenever the modal is closed
// (handles initial async data load + reset after close-without-save)
watchEffect(() => {
  if (!visible.value.share) {
    shareOption.value = data.value?.published ? 'public' : 'private'
  }
})

const saveShareOption = (close) => {
  const published = shareOption.value === 'public'
  return $fetch(`/api/users/${data.value?.uid}/collections/${data.value?.id}`, {
    method: 'post',
    body: { published },
  })
    .then(() => {
      refresh()
      toast.add(
        successToast('update', {
          entity: 'Collection',
          name: data.value?.name,
        }),
      )
      if (!published) close()
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
}

const copyShareUrl = async () => {
  if (!data.value?.published) {
    await saveShareOption(() => {})
  }
  navigator.clipboard.writeText(shareUrl.value)
  toast.add(noticeToast('copied'))
}

const sort = computed(
  () => data.value?.sort_by || 'artisan.maker_sculpt_id|artisan.name',
)

const hasOutdated = computed(() =>
  (data.value?.items || []).some((i) => i.artisan?.deleted),
)

const sortedCollections = computed(() => {
  const iteratees =
    sort.value === 'order|asc'
      ? sort.value.split('|')
      : ['artisan.maker_id', ...sort.value.split('|')]

  return sortBy(data.value?.items || [], iteratees)
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

const moveTo = (collection, item) => {
  moveItem(collection, item.id, colorwayTitle(item.artisan))
}

const remove = (id, colorway) => {
  removeItem(id, colorwayTitle(colorway))
}
</script>
