<template>
  <UDashboardPanel
    :id="`collection-${route.params.collection}`"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <UDashboardNavbar title="My Collections">
        <template #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="authenticated"
            v-model:visible="visible"
            title="Edit Collection"
          >
            <UButton icon="hugeicons:bookmark-03"> Edit </UButton>

            <template #body>
              <ModalCollectionForm
                :metadata="data"
                :uid="user.uid"
                :is-edit="true"
                @on-success="toggleShowEdit"
              />
            </template>
          </UModal>

          <UButton
            v-if="user.email_verified"
            icon="hugeicons:bookmark-remove-02"
            color="error"
            @click="deleteCollection"
          >
            Delete
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHeader
        :title="data?.name || 'Collection'"
        :ui="{
          root: 'pt-0',
          description: 'text-md',
        }"
      >
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
            footer: 'flex gap-2',
          }"
        >
          <NuxtImg
            loading="lazy"
            :alt="artisan.name"
            :src="artisan.img"
            class="h-full object-cover"
            :class="{
              grayscale: artisan.deleted,
            }"
          />

          <template v-if="artisan.deleted" #footer>
            <UButton color="warning" @click="remove(id, artisan)">
              Clear Outdated
            </UButton>
          </template>
          <template v-else #footer>
            <UButton
              v-if="buying"
              :icon="
                exchange
                  ? 'hugeicons:search-focus'
                  : 'hugeicons:shopping-basket-done-03'
              "
              :color="exchange ? 'neutral' : 'success'"
              @click="changeExchangeStatus({ id, exchange, artisan })"
            />
            <UButton
              v-if="selling"
              :icon="
                exchange
                  ? 'hugeicons:sale-tag-02'
                  : 'hugeicons:shopping-basket-remove-03'
              "
              :color="exchange ? 'neutral' : 'warning'"
              @click="changeExchangeStatus({ id, exchange, artisan })"
            />

            <SaveToCollection
              :item="{ id, artisan }"
              :move="true"
              icon="hugeicons:square-arrow-move-right-up"
              @on-select="moveTo"
            />

            <UButton icon="hugeicons:delete-02" color="error" />
          </template>
        </UPageCard>
      </UPageGrid>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import sortBy from 'lodash.sortby'

const confirm = useConfirm()
const toast = useToast()

const sort = ref('artisan.maker_sculpt_id|artisan.name')
const sortIcon = ref('hugeicons:sort-by-down-01')

const sortOptions = computed(() => [
  {
    label: 'Oldest First',
    icon: 'hugeicons:sort-by-up-01',
    value: 'order|asc',
    onSelect: () => {
      sortIcon.value = 'hugeicons:sort-by-up-01'
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
      icon: 'hugeicons:home-01',
      to: '/',
    },
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

  confirm.require({
    header: `Mark ${title} as...`,
    message: `Are you sure you want to mark this item as ${status}?`,
    rejectProps: {
      size: 'small',
      severity: 'secondary',
    },
    acceptProps: {
      size: 'small',
    },
    accept: () => {
      $fetch(
        `/api/users/${user.value.uid}/collections/${route.params.collection}/items/${id}`,
        { method: 'post', body: { exchange: !exchange } },
      )
        .then(() => {
          refresh()
          toast.add({
            severity: 'success',
            summary: `${title} has been successfully marked as ${status}.`,
            life: 3000,
          })
        })
        .catch((error) => {
          toast.add({ severity: 'error', summary: error.message, life: 3000 })
        })
    },
  })
}

const moveTo = (collection, item) => {
  const { id, artisan } = item

  confirm.require({
    header: 'Confirm to move artisan',
    message: `Are you sure you want to move ${colorwayTitle(artisan)} to [${collection.name}] collection?`,
    rejectProps: {
      size: 'small',
      label: 'Cancel',
      severity: 'secondary',
    },
    acceptProps: {
      size: 'small',
      label: 'Move',
    },
    accept: () => {
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
            severity: 'success',
            summary: `${colorwayTitle(artisan)} was moved to [${collection.name}] collection.`,
            life: 3000,
          })
        })
        .catch((error) => {
          toast.add({ severity: 'error', summary: error.message, life: 3000 })
        })
    },
  })
}

const remove = (id, colorway) => {
  confirm.require({
    header: 'Confirm to remove artisan',
    message: `Are you sure you want to remove ${colorwayTitle(colorway)}?`,
    rejectProps: {
      size: 'small',
      label: 'Cancel',
      severity: 'secondary',
    },
    acceptProps: {
      size: 'small',
      label: 'Remove',
      severity: 'danger',
    },
    accept: () => {
      $fetch(
        `/api/users/${user.value.uid}/collections/${route.params.collection}/items/${id}`,
        { method: 'delete' },
      )
        .then(() => {
          refresh()
          toast.add({
            severity: 'success',
            summary: `${colorwayTitle(colorway)} was removed.`,
            life: 3000,
          })
        })
        .catch((error) => {
          toast.add({ severity: 'error', summary: error.message, life: 3000 })
        })
    },
  })
}

const deleteCollection = () => {
  confirm.require({
    header: 'Confirm to delete collection',
    message: 'Are you sure you want to continue? This action cannot be undone.',
    rejectProps: {
      size: 'small',
      label: 'Cancel',
      severity: 'secondary',
    },
    acceptProps: {
      size: 'small',
      label: 'Delete',
      severity: 'danger',
    },
    accept: () => {
      $fetch(`/api/users/${data.value.uid}/collections/${data.value.id}`, {
        method: 'delete',
      })
        .then(() => {
          toast.add({
            severity: 'success',
            summary: `Collection [${data.value.name}] was deleted.`,
            life: 3000,
          })

          router.go(-1)
        })
        .catch((error) => {
          toast.add({ severity: 'error', summary: error.message, life: 3000 })
        })
    },
  })
}

const copyShareUrl = () => {
  navigator.clipboard.writeText(config.app.homepage + route.fullPath)
  toast.add({
    severity: 'success',
    summary: 'Copied to clipboard!',
    life: 3000,
  })
}

const visible = ref(false)
const toggleShowEdit = (shouldRefresh) => {
  visible.value = !visible.value
  if (shouldRefresh) {
    refresh()
  }
}
</script>
