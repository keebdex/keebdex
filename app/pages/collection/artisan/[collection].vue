<template>
  <UDashboardPanel :id="`collection-${route.params.collection}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="authenticated"
            v-model:visible="visible.edit"
            title="Edit Collection"
          >
            <UButton icon="hugeicons:bookmark-03"> Edit </UButton>

            <template #body="{ close }">
              <ModalCollectionForm
                :metadata="data"
                :uid="user.uid"
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
              v-if="user.email_verified"
              label="Delete"
              icon="hugeicons:bookmark-remove-01"
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
      <UPageHeader :title="data?.name || 'Collection'">
        <template #links>
          <UButton
            v-if="shareable"
            icon="hugeicons:copy-link"
            label="Copy URL"
            @click="copyShareUrl"
          />

          <USelect
            v-model="sort"
            :items="sortOptions"
            :icon="sortIcon"
            variant="soft"
            :ui="{ content: 'min-w-fit' }"
          />
        </template>
      </UPageHeader>

      <UAlert
        v-if="hasOutdated"
        description="Outdated items found during database sync. Please remove and re-add from the maker page if needed before deletion."
        icon="hugeicons:user-warning-01"
        color="warning"
        variant="soft"
      />

      <UPageGrid>
        <UPageCard
          v-for="{ id, exchange, artisan } in sortedCollections"
          :key="id"
          :title="artisan.name"
          :description="artisan?.sculpt.name"
          reverse
          spotlight
          :ui="{
            wrapper: 'flex-1',
          }"
        >
          <div class="aspect-square overflow-hidden">
            <NuxtImg
              loading="lazy"
              :alt="artisan.name"
              :src="artisan.img"
              class="h-full object-cover rounded"
              :class="{
                grayscale: artisan.deleted,
              }"
            />
          </div>

          <template v-if="artisan.deleted" #footer>
            <UButton
              icon="hugeicons:clean"
              color="warning"
              @click="remove(id, artisan)"
            >
              Clear Outdated
            </UButton>
          </template>
          <template v-else #footer>
            <UTooltip text="Change Status" :delay-duration="0">
              <UButton
                v-if="buying"
                :icon="
                  exchange
                    ? 'hugeicons:search-focus'
                    : 'hugeicons:bookmark-check-02'
                "
                :color="exchange ? 'neutral' : 'success'"
                @click="changeExchangeStatus({ id, exchange, artisan })"
              />
              <UButton
                v-if="selling"
                :icon="
                  exchange
                    ? 'hugeicons:sale-tag-02'
                    : 'hugeicons:bookmark-block-02'
                "
                :color="exchange ? 'neutral' : 'warning'"
                @click="changeExchangeStatus({ id, exchange, artisan })"
              />
            </UTooltip>

            <SaveToCollection
              :item="{ id, artisan }"
              :move="true"
              icon="hugeicons:move"
              @on-select="moveTo"
            />

            <UModal
              v-model:visible="visible.remove"
              title="Remove Artisan"
              :description="`Are you sure you want to remove ${colorwayTitle(artisan)}?`"
              :ui="{ footer: 'justify-end', content: 'divide-none' }"
            >
              <UTooltip text="Remove" :delay-duration="0">
                <UButton icon="hugeicons:bookmark-minus-02" color="error" />
              </UTooltip>

              <template #footer="{ close }">
                <UButton label="Cancel" @click="close" />
                <UButton
                  label="Remove"
                  color="error"
                  @click="remove(id, artisan)"
                />
              </template>
            </UModal>
          </template>
        </UPageCard>
      </UPageGrid>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import sortBy from 'lodash.sortby'

const toast = useToast()

const sort = ref('artisan.maker_sculpt_id|artisan.name')
const sortIcon = ref('hugeicons:sorting-a-z-02')

const sortOptions = computed(() => [
  {
    label: 'Oldest First',
    icon: 'hugeicons:sorting-1-9',
    value: 'order|asc',
    onSelect: () => {
      sortIcon.value = 'hugeicons:sorting-1-9'
    },
  },
  {
    label: 'Sculpt Name',
    icon: 'hugeicons:sorting-a-z-02',
    value: 'artisan.maker_sculpt_id|artisan.name',
    onSelect: () => {
      sortIcon.value = 'hugeicons:sorting-a-z-02'
    },
  },
  {
    label: 'Colorway Name',
    icon: 'hugeicons:sorting-a-z-02',
    value: 'artisan.name|artisan.maker_sculpt_id',
    onSelect: () => {
      sortIcon.value = 'hugeicons:sorting-a-z-02'
    },
  },
])

const config = useRuntimeConfig()

const userStore = useUserStore()
const { authenticated, user } = storeToRefs(userStore)

const route = useRoute()
const router = useRouter()

const { data, refresh } = await useAsyncData(() =>
  $fetch(`/api/collections/${route.params.collection}`),
)

const shareable = data.value?.published && data.value?.type === 'shareable'

const buying = ['to_buy', 'personal_buy'].includes(data.value?.type)
const selling = ['for_sale', 'personal_sell'].includes(data.value?.type)

useSeoMeta({
  title: data.value?.name ? `${data.value.name} • Collection` : 'Collection',
})

watchEffect(() => route.params.collection, refresh())

const hasOutdated = computed(() =>
  (data.value?.items || []).some((i) => i.artisan?.deleted),
)
const sortedCollections = computed(() => {
  return sortBy(data.value?.items || [], [
    'artisan.maker_id',
    ...sort.value.split('|'),
  ])
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

const changeTo = (exchange) => {
  if (data.value.type === 'to_buy' || data.value.type === 'personal_buy') {
    return exchange ? 'found' : 'wanted'
  }

  return exchange ? 'sold' : 'available'
}

const changeExchangeStatus = (item) => {
  const { id, exchange, artisan } = item
  const title = colorwayTitle(artisan)
  const status = changeTo(exchange)

  $fetch(
    `/api/users/${user.value.uid}/collections/${route.params.collection}/items/${id}`,
    { method: 'post', body: { exchange: !exchange } },
  )
    .then(() => {
      refresh()
      toast.add({
        color: 'success',
        title: `${title} has been successfully marked as ${status}.`,
      })
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}

const moveTo = (collection, item) => {
  const { id, artisan } = item

  $fetch(
    `/api/users/${user.value.uid}/collections/${route.params.collection}/items/${id}`,
    {
      method: 'post',
      body: {
        collection_id: collection.id,
        exchange: false,
      },
    },
  )
    .then(() => {
      refresh()
      toast.add({
        color: 'success',
        title: `${colorwayTitle(artisan)} was moved to [${collection.name}] collection.`,
      })
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })

  // confirm.require({
  //   header: 'Confirm to move artisan',
  //   message: `Are you sure you want to move ${colorwayTitle(artisan)} to [${collection.name}] collection?`,
  //   rejectProps: {
  //     size: 'small',
  //     label: 'Cancel',
  //     severity: 'secondary',
  //   },
  //   acceptProps: {
  //     size: 'small',
  //     label: 'Move',
  //   },
  //   accept: () => {},
  // })
}

const remove = (id, colorway) => {
  $fetch(
    `/api/users/${user.value.uid}/collections/${route.params.collection}/items/${id}`,
    { method: 'delete' },
  )
    .then(() => {
      refresh()
      toast.add({
        color: 'success',
        title: `${colorwayTitle(colorway)} was removed.`,
      })
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}

const deleteCollection = () => {
  $fetch(`/api/users/${data.value.uid}/collections/${data.value.id}`, {
    method: 'delete',
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: `Collection [${data.value.name}] was deleted.`,
      })

      router.go(-1)
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}

const copyShareUrl = () => {
  navigator.clipboard.writeText(config.app.homepage + route.fullPath)
  toast.add({
    color: 'success',
    title: 'Copied to clipboard!',
  })
}

const visible = ref({
  edit: false,
  delete: false,
  remove: false,
})
</script>
