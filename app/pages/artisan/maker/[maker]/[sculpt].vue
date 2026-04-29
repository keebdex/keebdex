<template>
  <UDashboardPanel :id="`${route.params.maker}-${route.params.sculpt}`">
    <template #header>
      <UDashboardNavbar :title="sculpt.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <div v-if="editable" class="flex items-center gap-2">
            <UModal v-model:visible="visible.create" title="Add Colorway">
              <UButton
                icon="hugeicons:dashboard-square-add"
                color="primary"
                label="Add Colorway"
              />

              <template #body="{ close }">
                <ArtisanModalColorwayForm
                  :metadata="newColorwayMetadata"
                  @on-success="
                    () => {
                      close()
                      refresh()
                    }
                  "
                />
              </template>
            </UModal>

            <UModal v-model:visible="visible.edit" title="Edit Sculpt">
              <UButton icon="hugeicons:dashboard-square-edit" label="Edit" />

              <template #body="{ close }">
                <ArtisanModalSculptForm
                  :is-edit="true"
                  :metadata="sculpt"
                  :sculpts="sculpt.maker_sculpts"
                  @on-success="
                    () => {
                      close()
                      refresh()
                    }
                  "
                />
              </template>
            </UModal>

            <USelect
              v-if="$device.isDesktopOrTablet"
              v-model="sortValue"
              :items="sortOptions"
              :icon="sortIconMap[sortValue]"
              variant="soft"
            />

            <SharedProfileDrawer
              v-if="sculpt.story"
              :title="sculpt.name"
              :description="sculpt.story"
            />

            <UModal
              title="Delete Sculpt"
              :description="`Are you sure you want to delete ${sculpt.name}? This action cannot be undone.`"
            >
              <UButton
                icon="hugeicons:delete-02"
                label="Delete"
                color="error"
              />

              <template #footer="{ close }">
                <UButton label="Cancel" @click="close" />
                <UButton
                  label="Delete"
                  color="error"
                  @click="deleteSculpt(close)"
                />
              </template>
            </UModal>
          </div>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="$device.isMobile">
        <USelect
          v-model="sortValue"
          :items="sortOptions"
          :icon="sortIconMap[sortValue]"
          variant="soft"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageGrid :class="squareGridClass">
        <UPageCard
          v-for="colorway in sculpt.colorways"
          :key="colorway.colorway_id"
          :title="colorway.name"
          reverse
          spotlight
          :ui="{
            root: 'h-full cursor-pointer flex flex-col',
            container: 'h-full grid grid-rows-[auto_minmax(0,1fr)]',
          }"
          @click="openColorwayCard(colorway)"
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
            <div class="flex items-center gap-2" @click.stop>
              <UModal v-if="editable" title="Edit Colorway">
                <UTooltip text="Edit" :delay-duration="0">
                  <UButton
                    icon="hugeicons:file-edit"
                    @click="setSelected(colorway)"
                  />
                </UTooltip>

                <template #body="{ close }">
                  <ArtisanModalColorwayForm
                    :metadata="selectedColorway"
                    @on-success="
                      () => {
                        close()
                        refresh()
                        clearSelected()
                      }
                    "
                  />
                </template>
              </UModal>

              <SharedSaveToCollection
                v-if="authenticated"
                :item="colorway"
                :text="true"
                @on-select="saveTo"
              />

              <UModal
                v-if="editable"
                title="Delete"
                :description="`Are you sure you want to delete ${colorway.name}? This action cannot be undone.`"
              >
                <UButton
                  v-if="user.email_verified"
                  icon="hugeicons:file-remove"
                  color="error"
                />

                <template #footer="{ close }">
                  <UButton label="Cancel" @click="close" />
                  <UButton
                    label="Delete"
                    color="error"
                    @click="deleteColorway(colorway, close)"
                  />
                </template>
              </UModal>
            </div>
          </template>
        </UPageCard>
      </UPageGrid>

      <UModal
        v-model:open="visible.card"
        :ui="{
          content: cardModalWidth,
        }"
        @update:open="(open) => !open && closeColorwayCard()"
      >
        <template #content>
          <ArtisanColorwayCard
            v-if="selectedColorway.colorway_id"
            :colorway="selectedColorway"
            :authenticated="authenticated"
            :orientation="cardOrientation"
            @save-to="saveTo"
          />
        </template>
      </UModal>

      <UPagination
        v-if="sculpt.total_colorways > size"
        :page="page"
        :items-per-page="size"
        :total="sculpt.total_colorways"
        class="border-t border-default pt-4 mt-auto"
        :ui="{
          list: 'justify-center',
        }"
        @update:page="setPage"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
const appConfig = useAppConfig()
const colorMode = useColorMode()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { isMobile } = useDevice()

const { page, size, setPage } = usePagination(72)

const sortField = ref('order')
const sortOrder = ref('desc')
const sortValue = ref('order|desc')

const sortOptions = [
  {
    label: 'Name (A-Z)',
    icon: appConfig.ui.icons.sortAlphaAsc,
    value: 'name|asc',
  },
  {
    label: 'Name (Z-A)',
    icon: appConfig.ui.icons.sortAlphaDesc,
    value: 'name|desc',
  },
  {
    label: 'Oldest First',
    icon: appConfig.ui.icons.sortNumberAsc,
    value: 'order|asc',
  },
  {
    label: 'Newest First',
    icon: appConfig.ui.icons.sortNumberDesc,
    value: 'order|desc',
  },
]

const sortIconMap = getSortIconMap(sortOptions)

watch(sortValue, (newValue) => {
  const [field, order] = newValue.split('|')
  sortField.value = field
  sortOrder.value = order
})

const { data: sculpt, refresh } = await useAsyncData(
  `maker:${route.params.maker}:${route.params.sculpt}`,
  () =>
    $fetch(`/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}`, {
      query: {
        cid: route.query.cid,
        order_by: sortField.value,
        sort: sortOrder.value,
        from: (page.value - 1) * size,
        to: page.value * size - 1,
      },
    }),
  {
    watch: [page, sortField, sortOrder, () => route.query.cid],
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
      to: `/artisan/maker/${sculpt.value.maker_id}?page=${page.value}`,
      avatar: {
        src: `/logo/${sculpt.value.maker_id}.png`,
        alt: sculpt.value.maker_name,
        ui: {
          root: 'bg-transparent',
          image:
            sculpt.value.invertible_logo && colorMode.value === 'dark'
              ? 'rounded-none invert'
              : 'rounded-none',
        },
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

defineOgImage('Module', {
  title: sculpt.value?.name,
  description: sculpt.value?.story,
  headline: sculpt.value?.maker_name,
  headlineLogo: `/logo/${sculpt.value?.maker_id}.png`,
})

const userStore = useUserStore()
const { authenticated, user } = storeToRefs(userStore)

const editable = computed(() => userStore.isEditable(sculpt.value?.maker_id))

const visible = ref({
  edit: false,
  create: false,
  card: false,
})

const { addItem } = useCollectionItem()

const saveTo = (collection, colorway) => {
  addItem(collection, { artisan_item_id: colorway.id }, colorway.name)
}

const newColorwayMetadata = computed(() => ({
  maker_id: sculpt.value.maker_id,
  sculpt_id: sculpt.value.sculpt_id,
  maker_sculpt_id: sculpt.value.maker_sculpt_id,
  currency: 'USD',
  sale_type: 'Raffle',
  order: (sculpt.value.total_colorways || 0) + 1,
}))

const selectedColorway = ref({})

const cardOrientation = computed(() => {
  if (isMobile || !selectedColorway.value?.description) {
    return 'vertical'
  }

  return 'horizontal'
})

const cardModalWidth = computed(() => {
  return cardOrientation.value === 'vertical' ? 'max-w-lg' : 'max-w-4xl'
})

const clearSelected = () => {
  selectedColorway.value = {}
}

const setSelected = (colorway) => {
  const { colorways, ...rest } = sculpt.value
  selectedColorway.value = {
    ...colorway,
    sculpt: rest,
  }
}

const colorwayCid = computed(() => {
  return typeof route.query.cid === 'string' ? route.query.cid : ''
})

const updateColorwayQuery = (cid) => {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      cid,
    },
  })
}

const closeColorwayCard = () => {
  visible.value.card = false
  clearSelected()

  if (colorwayCid.value) {
    updateColorwayQuery()
  }
}

const openColorwayCard = (colorway) => {
  setSelected(colorway)
  visible.value.card = true

  if (colorwayCid.value !== colorway.colorway_id) {
    updateColorwayQuery(colorway.colorway_id)
  }
}

const syncColorwayCardFromQuery = () => {
  if (!colorwayCid.value) {
    visible.value.card = false
    clearSelected()
    return
  }

  const selectedColorwayIndex = sculpt.value?.selected_colorway_index

  if (selectedColorwayIndex >= 0) {
    const targetPage = Math.floor(selectedColorwayIndex / size) + 1

    if (page.value !== targetPage) {
      setPage(targetPage)
      return
    }
  }

  const colorway = sculpt.value?.colorways?.find(
    (item) => item.colorway_id === colorwayCid.value,
  )

  if (!colorway) {
    visible.value.card = false
    clearSelected()
    return
  }

  setSelected(colorway)
  visible.value.card = true
}

watch(
  [
    colorwayCid,
    () => sculpt.value?.selected_colorway_index,
    () => sculpt.value?.colorways,
  ],
  () => {
    syncColorwayCardFromQuery()
  },
  { immediate: true },
)

const deleteSculpt = async (closeModal) => {
  try {
    await $fetch(
      `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}`,
      { method: 'delete' },
    )

    toast.add(handleSuccess('delete', sculpt.value.name, 'Sculpt'))

    closeModal()
    navigateTo(`/artisan/maker/${route.params.maker}`)
  } catch (error) {
    toast.add(handleError(error))
  }
}

const deleteColorway = async (colorway, closeModal) => {
  try {
    await $fetch(
      `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}/colorways/${colorway.id}`,
      { method: 'delete' },
    )

    toast.add(handleSuccess('delete', colorway.name))

    closeModal()
    refresh()
  } catch (error) {
    toast.add(handleError(error))
  }
}
</script>
