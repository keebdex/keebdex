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
            @deleted="onDeleted"
          >
            <UModal
              v-model:open="shareOpen"
              title="Share Collection"
              description="Control the visibility of this collection and generate a shareable link if needed."
            >
              <UButton
                icon="solar:share-circle-bold-duotone"
                label="Share"
                :ui="{ label: 'block' }"
              />

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
                  icon="solar:link-bold-duotone"
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
          </CollectionHeaderActions>
        </template>
      </UPageHeader>

      <UAlert
        v-if="hasOutdated"
        description="Outdated items found during database sync. Please remove and re-add from the maker page if needed before deletion."
        icon="solar:user-block-bold-duotone"
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
          :highlight="buying && rest.priority"
          :to="
            artisan.deleted
              ? undefined
              : `/artisan/maker/${artisan.maker_sculpt_id}?cid=${artisan.colorway_id}`
          "
        >
          <!-- The same marks as the Wishlist Image -->
          <template v-if="listing" #badges>
            <ArtisanListingMarks :item="rest" :buying="buying" />
          </template>

          <template v-if="isOwner" #footer-start>
            <UButton
              v-if="artisan.deleted"
              icon="solar:broom-bold-duotone"
              color="warning"
              label="Clear Outdated"
              :ui="{ label: 'block' }"
              @click="remove(rest.id, artisan)"
            />
            <SharedSaveToCollection
              v-else
              :item="{ ...rest, artisan }"
              :move="true"
              icon="solar:move-to-folder-bold-duotone"
              @on-select="moveTo"
            />
          </template>

          <template v-if="isOwner && !artisan.deleted" #footer-end>
            <UTooltip v-if="listing" text="Edit Listing">
              <UButton
                icon="solar:pen-bold-duotone"
                variant="ghost"
                :aria-label="`Edit ${colorwayTitle(artisan)} listing`"
                @click="editListing({ ...rest, artisan })"
              />
            </UTooltip>

            <UTooltip text="Remove">
              <UButton
                icon="solar:bookmark-minus-bold-duotone"
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
        icon="solar:ufo-bold-duotone"
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

const config = useRuntimeConfig()
const route = useRoute()
const toast = useToast()

const { data, status, refresh, onDeleted, isOwner } = useCollection(
  () => route.params.collection,
  'artisan keycap',
)

const { removeItem, moveItem, removing, confirmRemove, confirmRemoval } =
  useCollectionItem(() => route.params.collection, refresh)

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
    icon: 'solar:lock-bold-duotone',
  },
  {
    label: 'Create Public Link',
    description: listing.value
      ? 'Anyone with the link can view, and it is listed in the Trading Hub'
      : 'Anyone with the link can view',
    value: 'public',
    icon: 'solar:global-bold-duotone',
  },
])

const shareOpen = ref(false)

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
  if (!shareOpen.value) {
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

const sort = computed(() => artisanCollectionSort(data.value?.sort_by))

const hasOutdated = computed(() =>
  (data.value?.items || []).some((i) => i.artisan?.deleted),
)

const sortedCollections = computed(() =>
  sortBy(data.value?.items || [], [
    'artisan.maker_id',
    ...sort.value.split('|'),
  ]),
)

const breadcrumbs = computed(() => {
  return [
    {
      label: 'My Collection',
      icon: 'solar:bookmark-square-bold-duotone',
      to: '/collection',
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
