<template>
  <UDashboardPanel :id="`${route.params.maker}-${route.params.sculpt}`">
    <template #header>
      <UDashboardNavbar :title="sculpt.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- The sculpt's record: its name, the sculpt it revises, its story,
           and its specs -->
      <SharedDetailHero>
        <!-- The sculpt's name alone: the breadcrumb shows its maker -->
        <UPageHeader :title="sculpt.name" :ui="detailPageHeaderUi(false)">
          <template v-if="revisionOf" #headline>
            <span class="text-sm text-muted font-normal">
              Revision of
              <ULink
                :to="`/artisan/maker/${revisionOf.maker_sculpt_id}`"
                class="font-medium text-highlighted hover:underline"
              >
                {{ revisionOf.name }}
              </ULink>
            </span>
          </template>

          <!-- The page's actions sit with the sculpt they act on -->
          <template v-if="authenticated" #links>
            <UButton
              icon="hugeicons:dashboard-square-add"
              color="primary"
              label="Add Colorway"
              v-bind="addColorwayTarget"
            />

            <SharedRecordActions
              :editable="editable"
              :suggestable="canSuggest(sculpt)"
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
                  // A deleted sculpt has no page left: go back to its maker
                  () => navigateTo(`/artisan/maker/${route.params.maker}`),
                )
              "
            />
          </template>

          <template v-if="sculpt.story && !$device.isMobile" #description>
            <SharedDescription :description="sculpt.story" />
          </template>
        </UPageHeader>

        <!-- On phones the story and specs fold into Sculpt Details, closed
             by default, so the colorways start on the first screen -->
        <UCollapsible v-if="$device.isMobile && hasDetails">
          <UButton
            label="Sculpt Details"
            :trailing-icon="appConfig.ui.icons.chevronDown"
            block
            class="group justify-between"
            :ui="{
              label: 'block',
              trailingIcon:
                'transition-transform duration-200 group-data-[state=open]:rotate-180',
            }"
          />

          <template #content>
            <div class="space-y-4 pt-4">
              <SharedDescription
                v-if="sculpt.story"
                :description="sculpt.story"
                class="text-sm text-muted"
              />
              <SharedSpecList
                v-if="sculptSpecs.length"
                :items="sculptSpecs"
                layout="rows"
              />
            </div>
          </template>
        </UCollapsible>

        <!-- Only the specs the catalog has: most sculpts have a few -->
        <SharedSpecList
          v-else-if="sculptSpecs.length"
          :items="sculptSpecs"
          layout="rows"
        />
      </SharedDetailHero>

      <section class="space-y-4 pt-4">
        <!-- The list's own control sits with the list -->
        <UPageHeader
          title="Colorways"
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        >
          <template #links>
            <USelect
              v-model="sortValue"
              :items="sortOptions"
              :icon="sortIconMap[sortValue]"
              variant="soft"
              aria-label="Sort"
            />
          </template>
        </UPageHeader>

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
            @click="openColorway(colorway)"
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
            <!-- Save needs a signed-in user -->
            <template v-if="authenticated" #footer-start>
              <SharedSaveToCollection
                :item="colorway"
                :item-name="colorway.name"
                @on-select="saveTo"
              />
            </template>
          </SharedCatalogCard>
        </UPageGrid>
      </section>

      <ArtisanColorwayDrawer
        v-model:open="detailOpen"
        :colorway="selectedColorway"
        :authenticated="authenticated"
        @save-to="saveTo"
        @share="cardOpen = true"
      />

      <!-- Share Card: the trading card popup, over the drawer -->
      <UModal v-model:open="cardOpen" :ui="{ content: 'w-fit' }">
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
          domain="artisan"
          :parent-key="`${route.params.maker}/${route.params.sculpt}`"
          description="Every change to this sculpt and its colorways, newest first."
          @reverted="onReverted"
        />

        <UModal v-model:open="newColorwayOpen" title="Add Colorway">
          <template #body>
            <ArtisanModalColorwayForm
              :metadata="newColorwayMetadata"
              @on-success="
                () => {
                  newColorwayOpen = false
                  refresh()
                }
              "
            />
          </template>
        </UModal>

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

const { data: sculpt, refresh, error } = await useAsyncData(
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

throwIfNotFound(error.value)

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

const sculptSpecs = computed(() => sculptSpecItems(sculpt.value || {}))

const hasDetails = computed(
  () => !!sculpt.value?.story || sculptSpecs.value.length > 0,
)

// The sculpt this one revises: `is_revision_of` holds another of the maker's
// sculpts' maker_sculpt_id, so the maker's sculpt list has it
const revisionOf = computed(() =>
  sculpt.value?.is_revision_of
    ? sculpt.value.maker_sculpts?.find(
        (item) => item.maker_sculpt_id === sculpt.value.is_revision_of,
      )
    : null,
)

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

const description = computed(
  () =>
    sculpt.value?.story ||
    `Every colorway of the ${sculpt.value?.name} artisan keycap by ${sculpt.value?.maker_name}.`,
)

useSeoMeta({
  title: () =>
    sculpt.value ? `${sculpt.value.name} • ${sculpt.value.maker_name}` : '',
  description,
})

defineOgImage('Module', {
  title: sculpt.value?.name,
  description: description.value,
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

// The colorway drawer, and the trading card popup it opens (Share Card)
const detailOpen = ref(false)
const cardOpen = ref(false)

const editingSculpt = ref(false)
const newColorwayOpen = ref(false)

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

// Staff add a colorway in place; other signed-in users submit one
const addColorwayTarget = computed(() =>
  submissionTarget(
    editable.value,
    () => (newColorwayOpen.value = true),
    'artisan',
    { maker: route.params.maker, sculpt: route.params.sculpt },
  ),
)

const selectedColorway = ref({})

// A colorway with its sculpt, as the drawer, the popup, and the form take it
const withSculpt = (colorway) => {
  const { colorways, ...rest } = sculpt.value
  return { ...colorway, sculpt: rest }
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

// `?cid=` opens a colorway's drawer (the query watcher below), so links from
// search and collections land on it; closing the drawer drops it from the URL
const openColorway = (colorway) => updateColorwayQuery(colorway.colorway_id)

watch(detailOpen, (open) => {
  if (open) return

  // The drawer keeps its colorway while it slides out
  cardOpen.value = false

  if (colorwayCid.value) {
    updateColorwayQuery()
  }
})

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
    detailOpen.value = false
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
    detailOpen.value = false
    return
  }

  selectedColorway.value = withSculpt(colorway)
  detailOpen.value = true
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
} = useConfirmDelete(refresh)
</script>
