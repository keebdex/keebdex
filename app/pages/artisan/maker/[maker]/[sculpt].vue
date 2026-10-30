<template>
  <UDashboardPanel :id="`${route.params.maker}-${route.params.sculpt}`">
    <template #header>
      <UDashboardNavbar :title="sculpt.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <!-- Add keeps its label; the other actions are icon-only, named by
             their tooltips and aria-labels -->
        <template #right>
          <div class="flex items-center gap-2">
            <UModal v-if="editable" title="Add Colorway">
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

            <UButton
              v-else-if="authenticated"
              icon="hugeicons:dashboard-square-add"
              color="primary"
              label="Add Colorway"
              :to="{
                path: '/artisan/submissions/submit',
                query: {
                  maker: route.params.maker,
                  sculpt: route.params.sculpt,
                },
              }"
            />

            <SharedRecordActions
              :editable="editable"
              :suggestable="canSuggest(sculpt)"
              :ghost="false"
              label="Sculpt"
              @edit="editingSculpt = true"
              @suggest="
                suggest('artisan_sculpt', sculpt, {
                  sculpts: sculpt.maker_sculpts,
                })
              "
              @history="history?.show()"
              @delete="
                openDelete(
                  'Sculpt',
                  sculpt.name,
                  `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}`,
                )
              "
            />

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
      <UPageGrid :class="artisanGridClass">
        <SharedCatalogCard
          v-for="colorway in sculpt.colorways"
          :key="colorway.colorway_id"
          :title="colorway.name"
          :img="colorway.img"
          aspect="square"
          :editable="editable"
          :suggestable="canSuggest(colorway)"
          class="cursor-pointer"
          @click="openColorwayCard(colorway)"
          @edit="openColorwayForm(colorway)"
          @suggest="suggest('artisan_colorway', colorway)"
          @history="showColorwayHistory(colorway)"
          @delete="
            openDelete(
              'Colorway',
              colorway.name,
              `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}/colorways/${colorway.id}`,
            )
          "
        >
          <!-- Save needs a signed-in user; copying lives in the popup -->
          <template v-if="authenticated" #footer-start>
            <SharedSaveToCollection
              :item="colorway"
              :item-name="colorway.name"
              label="Save"
              keep-label
              @on-select="saveTo"
            />
          </template>
        </SharedCatalogCard>
      </UPageGrid>

      <UModal
        v-model:open="visible.card"
        :ui="{
          content: 'w-fit',
        }"
        @update:open="(open) => !open && closeColorwayCard()"
      >
        <template #content>
          <ArtisanColorwayCard
            v-if="selectedColorway.colorway_id"
            :colorway="selectedColorway"
          />
        </template>
      </UModal>

      <template v-if="editable">
        <SharedRevisionHistory
          ref="history"
          :button="false"
          domain="artisan"
          :parent-key="`${route.params.maker}/${route.params.sculpt}`"
          description="Every change to this sculpt and its colorways, newest first."
          @reverted="onReverted"
        />

        <UModal v-model:open="editingSculpt" title="Edit Sculpt">
          <template #body>
            <ArtisanModalSculptForm
              :is-edit="true"
              :metadata="sculpt"
              :sculpts="sculpt.maker_sculpts"
              @on-success="
                () => {
                  editingSculpt = false
                  refresh()
                }
              "
            />
          </template>
        </UModal>

        <UModal v-model:open="colorwayForm.open" title="Edit Colorway">
          <template #body>
            <ArtisanModalColorwayForm
              :metadata="colorwayForm.metadata"
              @on-success="onColorwaySaved"
            />
          </template>
        </UModal>

        <SharedConfirmModal
          v-model:open="deleteTarget.open"
          :title="`Delete ${deleteTarget.entity}`"
          :description="`Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`"
          :loading="deleting"
          @confirm="confirmDelete"
        />
      </template>

      <SharedSuggestEditModal
        v-if="suggestTarget"
        v-model:open="suggestOpen"
        :entity-type="suggestTarget.entityType"
        :record="suggestTarget.record"
        :form-props="suggestTarget.formProps"
      />

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
const route = useRoute()
const router = useRouter()

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

// Reverting a rename moves the sculpt back to its old slug.
const onReverted = ({ entityType, changes }) => {
  if (
    entityType === 'artisan_sculpt' &&
    changes.sculpt_id &&
    changes.sculpt_id !== route.params.sculpt
  ) {
    return navigateTo(
      `/artisan/maker/${route.params.maker}/${changes.sculpt_id}`,
    )
  }

  refresh()
}

const breadcrumbs = computed(() => {
  return [
    {
      label: 'Makers',
      icon: 'hugeicons:user-multiple',
      to: '/artisan/maker',
    },
    {
      label: sculpt.value.maker_name,
      to: `/artisan/maker/${sculpt.value.maker_id}?page=${page.value}`,
      avatar: {
        src: logoUrl(sculpt.value.maker_id),
        alt: sculpt.value.maker_name,
        ui: {
          root: 'bg-transparent',
          image: sculpt.value.invertible_logo
            ? 'rounded-none dark:invert'
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
  headlineLogo: logoUrl(sculpt.value?.maker_id),
})

const userStore = useUserStore()
const { authenticated } = storeToRefs(userStore)

const editable = computed(() => userStore.isEditable(sculpt.value?.maker_id))

const {
  target: suggestTarget,
  open: suggestOpen,
  canSuggest,
  suggest,
} = useSuggestEdit(editable)

const visible = ref({
  card: false,
})

const editingSculpt = ref(false)

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

const clearSelected = () => {
  selectedColorway.value = {}
}

// A colorway with its sculpt, as the popup and the form take it
const withSculpt = (colorway) => {
  const { colorways, ...rest } = sculpt.value
  return { ...colorway, sculpt: rest }
}

const setSelected = (colorway) => {
  selectedColorway.value = withSculpt(colorway)
}

const colorwayForm = reactive({ open: false, metadata: {} })

const openColorwayForm = (colorway) => {
  Object.assign(colorwayForm, { open: true, metadata: withSculpt(colorway) })
}

const onColorwaySaved = () => {
  colorwayForm.open = false
  refresh()
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

const history = useTemplateRef('history')

const showColorwayHistory = (colorway) => {
  history.value?.show({
    record: {
      entityType: 'artisan_colorway',
      entityId: colorway.id,
      label: colorway.name,
    },
  })
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

const {
  target: deleteTarget,
  deleting,
  open: openDelete,
  confirm: confirmDelete,
} = useConfirmDelete(() =>
  // A deleted sculpt has no page left: go back to its maker
  deleteTarget.entity === 'Sculpt'
    ? navigateTo(`/artisan/maker/${route.params.maker}`)
    : refresh(),
)
</script>
