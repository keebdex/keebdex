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
            :icon="appConfig.ui.icons.sortManual"
            label="Manual Sort"
            :to="`/collection/artisan/${route.params.collection}/sort`"
          />

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
      <UAlert
        v-if="hasOutdated"
        description="Outdated items found during database sync. Please remove and re-add from the maker page if needed before deletion."
        icon="hugeicons:user-warning-01"
        color="warning"
      />

      <UPageGrid v-if="sortedCollections.length" :class="squareGridClass">
        <UPageCard
          v-for="{ artisan, ...rest } in sortedCollections"
          :key="rest.id"
          :title="artisan.name"
          :description="artisan?.sculpt.name"
          reverse
          spotlight
          :highlight="rest.priority"
          :ui="{
            wrapper: 'flex-1',
          }"
        >
          <div class="relative aspect-square overflow-hidden">
            <NuxtImg
              loading="lazy"
              :alt="artisan.name"
              :src="artisan.img"
              class="h-full object-cover rounded"
              :class="{
                grayscale: !rest.exchange || artisan.deleted,
              }"
            />
            <span
              v-if="!rest.exchange"
              class="absolute inset-0 flex items-center justify-center"
            >
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
          </div>

          <template v-if="authenticated && artisan.deleted" #footer>
            <UButton
              icon="hugeicons:clean"
              color="warning"
              @click="remove(rest.id, artisan)"
            >
              Clear Outdated
            </UButton>
          </template>
          <template v-else-if="authenticated" #footer>
            <UModal
              v-model:visible="visible.edit_item"
              :title="`Edit ${colorwayTitle(artisan)} Details`"
            >
              <UTooltip text="Edit Listing" :delay-duration="0">
                <UButton icon="hugeicons:file-edit" />
              </UTooltip>

              <template #body="{ close }">
                <CollectionModalCollectionItemForm
                  :metadata="rest"
                  :buying="buying"
                  :selling="selling"
                  @on-success="
                    () => {
                      close()
                      refresh()
                    }
                  "
                />
              </template>
            </UModal>

            <SharedSaveToCollection
              :item="{ ...rest, artisan }"
              :move="true"
              icon="hugeicons:move-to"
              @on-select="moveTo"
            />

            <UModal
              v-model:visible="visible.remove"
              title="Remove Artisan"
              :description="`Are you sure you want to remove ${colorwayTitle(artisan)}?`"
            >
              <UTooltip text="Remove" :delay-duration="0">
                <UButton icon="hugeicons:bookmark-minus-02" color="error" />
              </UTooltip>

              <template #footer="{ close }">
                <UButton label="Cancel" @click="close" />
                <UButton
                  label="Remove"
                  color="error"
                  @click="remove(rest.id, artisan)"
                />
              </template>
            </UModal>
          </template>
        </UPageCard>
      </UPageGrid>

      <UPageSection
        v-else-if="status === 'success'"
        icon="hugeicons:alien-01"
        title="No Artisans Yet"
        description="Save artisan items from their respective pages to start building this collection."
        class="mx-auto"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
import sortBy from 'lodash.sortby'

const appConfig = useAppConfig()
const config = useRuntimeConfig()
const route = useRoute()
const toast = useToast()

const { authenticated } = storeToRefs(useUserStore())

const { data, status, refresh, deleteCollection } = useCollection(
  () => route.params.collection,
)

const { removeItem, moveItem } = useCollectionItem(
  () => route.params.collection,
  refresh,
)

const buying = computed(() => data.value?.intent === 'want')
const selling = computed(() => data.value?.intent === 'sell')

const shareUrl = computed(() => config.public.site.homepage + route.fullPath)
const shareOption = ref('private')
const shareItems = [
  {
    label: 'Keep Private',
    description: 'Only you have access',
    value: 'private',
    icon: 'hugeicons:locked',
  },
  {
    label: 'Create Public Link',
    description: 'Anyone with the link can view',
    value: 'public',
    icon: 'hugeicons:global',
  },
]

const visible = ref({
  share: false,
  edit: false,
  delete: false,
  remove: false,
  edit_item: false,
})

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
      toast.add(handleSuccess('update', data.value?.name, 'Collection'))
      if (!published) close()
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}

const copyShareUrl = async () => {
  if (!data.value?.published) {
    await saveShareOption(() => {})
  }
  navigator.clipboard.writeText(shareUrl.value)
  toast.add(handleNotice('copy'))
}

const sort = computed(
  () => data.value?.sort_by || 'artisan.maker_sculpt_id|artisan.name',
)

useSeoMeta({
  title: data.value?.name ? `${data.value.name} • Collection` : 'Collection',
})

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
