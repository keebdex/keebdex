<template>
  <div>
    <PanelBreadcrumb :breadcrumbs="breadcrumbs" />

    <Panel
      :header="data?.name || 'Collection'"
      pt:root:class="!border-0 !bg-transparent"
      pt:title:class="flex items-center gap-4 font-medium text-3xl"
    >
      <template #icons>
        <div v-if="$device.isDesktopOrTablet" class="flex gap-2">
          <Button
            v-if="shareable"
            icon="pi pi-link"
            label="Copy URL"
            severity="secondary"
            @click="copyShareUrl"
          />

          <SplitButton
            :icon="sortItem.icon"
            :label="sortItem.label"
            severity="secondary"
            :model="sortOptions"
          />

          <Button
            v-if="authenticated"
            icon="pi pi-pen-to-square"
            label="Edit"
            severity="secondary"
            @click="toggleShowEdit"
          />

          <Button
            v-if="user.email_verified"
            icon="pi pi-trash"
            label="Delete"
            severity="danger"
            @click="deleteCollection"
          />
        </div>
        <Button
          v-else
          aria-haspopup="true"
          aria-controls="overlay_menu"
          icon="pi pi-ellipsis-v"
          severity="secondary"
          @click="toggleActions"
        >
        </Button>
        <Menu id="overlay_menu" ref="menu" :model="mobile" :popup="true" />
      </template>

      <Message
        v-if="hasOutdated"
        class="w-fit mx-auto mb-4"
        severity="warn"
        icon="pi pi-exclamation-triangle"
      >
        Outdated items found during database sync. Please remove and re-add from
        the maker page if needed before deletion.
      </Message>

      <DataView
        :value="sortedCollections"
        layout="grid"
        paginator
        :rows="60"
        :total-records="sortedCollections.length"
        :always-show-paginator="false"
        :pt="{
          content: '!bg-transparent',
          pcPaginator: {
            paginatorContainer: '!border-0 pt-4',
            root: '!bg-transparent',
          },
        }"
      >
        <template v-if="!data" #empty>
          <div class="flex flex-col items-center gap-8">
            <NuxtImg class="w-1/3" src="/svg/cancel.svg" alt="Unauthorized" />

            <div class="text-2xl">
              You are not authorized to view this collection.
            </div>
          </div>
        </template>

        <template #grid="{ items }">
          <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
          >
            <Card
              v-for="{ id, exchange, artisan } in items"
              :key="id"
              class="overflow-hidden"
              :pt="{
                header: 'w-full aspect-square overflow-hidden',
                body: 'flex-1 items-center',
                caption: 'flex flex-1 items-center',
                title: 'flex flex-grow text-center',
              }"
            >
              <template #header>
                <img
                  loading="lazy"
                  :alt="artisan.name"
                  :src="artisan.img"
                  class="h-full object-cover"
                  :class="{
                    grayscale: artisan.deleted,
                  }"
                />
              </template>
              <template #title>{{ artisan.name || '-' }}</template>
              <template #subtitle>{{ artisan?.sculpt.name }}</template>

              <template #footer>
                <Button
                  v-if="artisan.deleted"
                  size="small"
                  text
                  label="Clear Outdated"
                  severity="warn"
                  icon="pi pi-eraser"
                  fluid
                  @click="remove(id, artisan)"
                />
                <div v-else class="flex gap-2">
                  <Button
                    v-if="trading"
                    v-tooltip.top="`Mark as ${changeTo(exchange)}`"
                    size="small"
                    text
                    :severity="exchange ? 'secondary' : 'success'"
                    :icon="exchange ? 'pi pi-circle' : 'pi pi-check-circle'"
                    fluid
                    @click="changeExchangeStatus({ id, exchange, artisan })"
                  />

                  <SaveToCollection
                    :item="{ id, artisan }"
                    :text="true"
                    :move="true"
                    @on-select="moveTo"
                  />

                  <Button
                    v-tooltip.top="'Remove'"
                    size="small"
                    text
                    severity="danger"
                    icon="pi pi-trash"
                    fluid
                    @click="remove(id, artisan)"
                  />
                </div>
              </template>
            </Card>
          </div>
        </template>
      </DataView>

      <Dialog
        v-model:visible="visible"
        modal
        header="Edit Collection"
        dismissable-mask
        class="w-[36rem]"
      >
        <ModalCollectionForm
          :metadata="data"
          :uid="user.uid"
          :is-edit="true"
          @on-success="toggleShowEdit"
        />
      </Dialog>
    </Panel>

    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup>
import sortBy from 'lodash.sortby'

const breadcrumbs = computed(() => {
  return [
    {
      icon: 'pi pi-home',
      route: '/',
    },
    {
      label: 'My Collections',
      route: `/collection`,
    },
  ]
})

const confirm = useConfirm()
const toast = useToast()

const sort = ref('artisan.maker_sculpt_id|artisan.name')
const sortItem = ref({ label: 'Sculpt Name', icon: 'pi pi-sort-alpha-down' })
const sortOptions = computed(() => [
  {
    label: 'Oldest First',
    icon: 'pi pi-sort-numeric-down',
    class: sort.value === 'id' && activePopMenu,
    command: ({ item }) => {
      sort.value = 'id'
      sortItem.value = item
    },
  },
  {
    label: 'Sculpt Name',
    icon: 'pi pi-sort-alpha-down',
    class:
      sort.value === 'artisan.maker_sculpt_id|artisan.name' && activePopMenu,
    command: ({ item }) => {
      sort.value = 'artisan.maker_sculpt_id|artisan.name'
      sortItem.value = item
    },
  },
  {
    label: 'Colorway Name',
    icon: 'pi pi-sort-alpha-down',
    class:
      sort.value === 'artisan.name|artisan.maker_sculpt_id' && activePopMenu,
    command: ({ item }) => {
      sort.value = 'artisan.name|artisan.maker_sculpt_id'
      sortItem.value = item
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
const trading = [
  'to_buy',
  'for_sale',
  'personal_buy',
  'personal_sell',
].includes(data.value?.type)

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

const menu = ref()
const toggleActions = (event) => {
  menu.value.toggle(event)
}

const mobile = computed(() => {
  return [
    {
      label: 'Editing',
      visible: authenticated,
      items: [
        {
          label: 'Copy URL',
          icon: 'pi pi-link',
          visible: shareable,
          command: copyShareUrl,
        },
        {
          label: 'Edit',
          icon: 'pi pi-pen-to-square',
          visible: authenticated.value,
          command: toggleShowEdit,
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          visible: user.value.email_verified,
          command: deleteCollection,
        },
      ],
    },
    {
      label: 'Sorting',
      items: sortOptions.value,
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
