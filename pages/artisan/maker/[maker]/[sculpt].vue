<template>
  <UDashboardPanel :id="`${route.params.maker}-${route.params.sculpt}`">
    <template #header>
      <UDashboardNavbar :title="sculpt.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="editable"
            v-model:visible="visible.edit"
            title="Edit Sculpt"
          >
            <UButton icon="hugeicons:user-edit-01"> Edit </UButton>

            <template #body>
              <ModalSculptForm
                :is-edit="true"
                :metadata="sculpt"
                @on-success="toggleEditSculpt"
              />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <SculptPageHeader :sculpt="sculpt" @on-sorting="onChangeSorting" />

      <UPageGrid>
        <UPageCard
          v-for="colorway in sculpt.colorways"
          :key="colorway.colorway_id"
          :title="colorway.name"
          orientation="vertical"
          reverse
          spotlight
          :ui="{
            root: 'h-full overflow-hidden',
            wrapper: 'flex-1',
          }"
        >
          <div class="aspect-square overflow-hidden">
            <NuxtImg
              loading="lazy"
              :alt="colorway.name"
              :src="colorway.img"
              class="w-full h-full object-cover rounded"
            />
          </div>

          <template #footer>
            <UModal
              v-model:visible="visible.add"
              :title="
                selectedColorway && selectedColorway.name
                  ? `Edit ${colorwayTitle(selectedColorway)}`
                  : 'Add Colorway'
              "
            >
              <UButton
                icon="hugeicons:file-edit"
                @click="toggleEditColorway(colorway)"
              />

              <template #body>
                <ModalColorwayForm
                  :metadata="selectedColorway"
                  @on-success="toggleAddColorway"
                />
              </template>
            </UModal>

            <UModal v-model:visible="visible.card">
              <UButton
                icon="hugeicons:zoom-in-area"
                @click="toggleColorwayCard(colorway)"
              />

              <template #content>
                <ModalColorwayCard
                  :colorway="selectedColorway"
                  :editable="editable"
                  :authenticated="authenticated"
                  @edit-colorway="toggleEditColorway"
                  @save-to="saveTo"
                />
              </template>
            </UModal>

            <SaveToCollection
              v-if="authenticated"
              :item="colorway"
              :text="true"
              @on-select="saveTo"
            />
          </template>
        </UPageCard>
      </UPageGrid>
    </template>
  </UDashboardPanel>
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
      label: 'Makers',
      icon: 'hugeicons:user-group-03',
      to: '/artisan/maker',
    },
    {
      label: sculpt.value.maker_name,
      to: `/artisan/maker/${sculpt.value.maker_id}`,
      avatar: {
        src: `/logo/${sculpt.value.maker_id}.png`,
        alt: sculpt.value.maker_name,
      },
    },
    {
      label: sculpt.value.name,
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
          title: data.message,
        })
      } else {
        toast.add({
          color: 'success',
          title: `${colorway.name} has been added to [${collection.name}].`,
        })
      }
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}
</script>
