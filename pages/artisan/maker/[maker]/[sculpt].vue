<template>
  <div>
    <PanelBreadcrumb :breadcrumbs="breadcrumbs" />

    <Panel
      :header="sculpt.name"
      pt:root:class="!border-0 !bg-transparent"
      pt:title:class="flex items-center gap-4 font-medium text-3xl"
    >
      <div v-if="sculpt.story" class="mb-4 leading-6 text-muted-color">
        <p
          v-for="(line, idx) in sculpt.story.split('\n')"
          :key="idx"
          class="mb-2"
        >
          {{ line }}
        </p>
      </div>

      <template #icons>
        <SculptProfileActions
          :sculpt="sculpt"
          :editable="editable"
          @on-edit="toggleEditSculpt"
          @on-sorting="onChangeSorting"
        />
      </template>

      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
      >
        <Card
          v-for="(colorway, idx) in sculpt.colorways"
          :key="colorway.colorway_id"
          class="overflow-hidden colorway-card"
          :pt="{
            header: 'w-full h-44 md:h-60',
            body: 'flex-1 items-center',
            caption: 'flex flex-1 items-center',
            title: 'flex flex-grow text-center',
            footer: 'flex gap-2',
          }"
        >
          <template #header>
            <img
              loading="lazy"
              :alt="colorway.name"
              :src="colorway.img"
              class="w-full h-full object-cover cursor-pointer"
              @click="toggleColorwayCard(colorway)"
            />
          </template>
          <template #title>{{ colorway.name || '-' }}</template>

          <template v-if="!copying" #footer>
            <Button
              v-if="editable"
              v-tooltip.top="'Edit'"
              text
              size="small"
              severity="secondary"
              icon="pi pi-pen-to-square"
              @click="toggleEditColorway(colorway)"
            />

            <Button
              v-tooltip.top="'Copy Card'"
              text
              size="small"
              severity="secondary"
              icon="pi pi-images"
              @click="copyColorwayCard(idx)"
            />

            <Button
              v-tooltip.top="'Expand'"
              text
              size="small"
              severity="secondary"
              icon="pi pi-expand"
              @click="toggleColorwayCard(colorway)"
            />

            <SaveToCollection
              v-if="authenticated"
              :item="colorway"
              :text="true"
              @on-select="saveTo"
            />
          </template>
        </Card>
      </div>

      <Paginator
        class="mt-4"
        :rows="size"
        :total-records="sculpt.total_colorways"
        :always-show="false"
        pt:root:class="!bg-transparent"
        @page="(e) => (page = e.page + 1)"
      />

      <Dialog
        v-model:visible="visible.edit"
        modal
        header="Edit Sculpt"
        dismissable-mask
        class="w-[36rem]"
      >
        <ModalSculptForm
          :is-edit="true"
          :metadata="sculpt"
          @on-success="toggleEditSculpt"
        />
      </Dialog>

      <Dialog
        v-model:visible="visible.add"
        modal
        :header="
          selectedColorway && selectedColorway.name
            ? `Edit ${colorwayTitle(selectedColorway)}`
            : 'Add Colorway'
        "
        class="w-[36rem]"
        dismissable-mask
      >
        <ModalColorwayForm
          :metadata="selectedColorway"
          @on-success="toggleAddColorway"
        />
      </Dialog>

      <Dialog
        v-model:visible="visible.card"
        modal
        class="max-w-lg"
        :closable="false"
        dismissable-mask
      >
        <ModalColorwayCard
          :colorway="selectedColorway"
          :editable="editable"
          :authenticated="authenticated"
          @edit-colorway="toggleEditColorway"
          @save-to="saveTo"
        />
      </Dialog>

      <Toast />
    </Panel>
  </div>
</template>

<script setup>
const route = useRoute()
const toast = useToast()

const size = 60
const page = ref(1)

const sortField = ref('order')
const sortOrder = ref('desc')
const onChangeSorting = (value) => {
  const [field, order] = value.split('|')
  sortField.value = field
  sortOrder.value = order
}

const { data: sculpt, refresh } = await useAsyncData(
  `maker:${route.params.maker}:${route.params.sculpt}`,
  () =>
    $fetch(`/api/makers/${route.params.maker}`, {
      query: {
        sculpt: route.params.sculpt,
        order_by: sortField.value,
        sort: sortOrder.value,
        from: (page.value - 1) * size,
        to: page.value * size - 1,
      },
    }),
  {
    watch: [page, sortField, sortOrder],
    transform: (data) => {
      const sculpt = data.sculpts[route.params.sculpt]

      sculpt.maker_name = data.name
      sculpt.invertible_logo = data.invertible_logo

      return sculpt
    },
  },
)

const breadcrumbs = computed(() => {
  return [
    {
      icon: 'pi pi-home',
      route: '/',
    },
    {
      label: 'Makers',
      route: '/artisan/maker',
    },
    {
      label: sculpt.value.maker_name,
      route: `/artisan/maker/${sculpt.value.maker_id}`,
    },
  ]
})

useSeoMeta({
  title: sculpt.value
    ? `${sculpt.value.name} • ${sculpt.value.maker_name}`
    : '',
  description: sculpt.value?.story,
  ogDescription: sculpt.value?.story,
  twitterDescription: sculpt.value?.story,
})

defineOgImageComponent('Artisan', {
  title: sculpt.value?.name,
  makerId: sculpt.value?.maker_id,
  makerName: sculpt.value?.maker_name,
  invertible: sculpt.value?.invertible_logo,
})

watch(
  () => route.query.cid,
  () => {
    const clw = sculpt.value.colorways.find(
      (c) => c.colorway_id === route.query.cid,
    )
    if (clw) {
      toggleColorwayCard(clw)
    }
  },
)

onMounted(() => {
  const clw = sculpt.value.colorways.find(
    (c) => c.colorway_id === route.query.cid,
  )
  if (clw) {
    toggleColorwayCard(clw)
  }
})

const userStore = useUserStore()
const { authenticated, user } = storeToRefs(userStore)

const editable = computed(() => userStore.isEditable(sculpt.value.maker_id))

const visible = ref({
  edit: false,
  add: false,
  card: false,
})

// edit sculpt
const toggleEditSculpt = (shouldRefresh) => {
  visible.value.edit = !visible.value.edit
  if (shouldRefresh) {
    refresh()
  }
}

/**
 * New colorway submission
 * Currently, just add/update colorway description
 */
const toggleAddColorway = (clw, shouldRefresh) => {
  visible.value.add = !visible.value.add
  if (shouldRefresh) {
    refresh()
  }
}

// show colorway card popup
const selectedColorway = ref({})
const setSelectedColorway = (clw) => {
  selectedColorway.value = {
    ...clw,
    sculpt: sculpt.value,
  }
}

const toggleColorwayCard = (clw) => {
  setSelectedColorway(clw)
  visible.value.card = !visible.value.card
}

// edit colorway
const toggleEditColorway = (clw, shouldRefresh) => {
  setSelectedColorway(clw)
  toggleAddColorway(shouldRefresh)
}

// add to collection
const saveTo = (collection, colorway) => {
  const item = {
    uid: user.value.uid,
    collection_id: collection.id,
    artisan_item_id: colorway.id,
  }

  $fetch(`/api/users/${user.value.uid}/collections/${collection.id}/items`, {
    method: 'post',
    body: item,
  })
    .then((data) => {
      if (data?.message) {
        toast.add({
          severity: 'info',
          summary: data.message,
          life: 3000,
        })
      } else {
        toast.add({
          severity: 'success',
          summary: `${colorway.name} has been added to [${collection.name}].`,
          life: 3000,
        })
      }
    })
    .catch((error) => {
      toast.add({ severity: 'error', summary: error.message, life: 3000 })
    })
}

const copying = ref(false)
const copyColorwayCard = async (idx) => {
  copying.value = true

  const card = document.getElementsByClassName('colorway-card')[idx]
  card.classList.add('p-2')

  try {
    await copyScreenshot(card, toast)
  } catch (error) {
    toast.add({ severity: 'error', summary: error.message, life: 3000 })
  }

  card.classList.remove('p-2')
  copying.value = false
}
</script>
