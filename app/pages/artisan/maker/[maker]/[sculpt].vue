<template>
  <UDashboardPanel :id="`${route.params.maker}-${route.params.sculpt}`">
    <template #header>
      <UDashboardNavbar :title="sculpt.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UModal
              v-if="editable"
              v-model:visible="visible.create"
              title="Add Colorway"
            >
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

            <UButton
              v-if="canSuggest(sculpt)"
              icon="hugeicons:dashboard-square-edit"
              label="Edit"
              @click="
                suggest('artisan_sculpt', sculpt, {
                  sculpts: sculpt.maker_sculpts,
                })
              "
            />

            <template v-if="editable">
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

              <SharedRevisionHistory
                ref="history"
                domain="artisan"
                :parent-key="`${route.params.maker}/${route.params.sculpt}`"
                description="Every change to this sculpt and its colorways, newest first."
                @reverted="onReverted"
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
            </template>
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
        <UPageCard
          v-for="colorway in sculpt.colorways"
          :key="colorway.colorway_id"
          :title="colorway.name"
          reverse
          spotlight
          :ui="{
            root: 'colorway-card h-full cursor-pointer flex flex-col',
            container: imageCardContainerClass,
          }"
          @click="openColorwayCard(colorway)"
        >
          <div class="aspect-square overflow-hidden relative">
            <NuxtImg
              v-if="colorway.img"
              preset="square"
              loading="lazy"
              decoding="async"
              :alt="colorway.name"
              :src="colorway.img"
              class="w-full h-full object-cover rounded"
            />
            <!-- No photo yet: invite the community to add one -->
            <div
              v-else
              class="w-full h-full rounded bg-elevated flex flex-col items-center justify-center gap-3 text-dimmed"
            >
              <UIcon name="hugeicons:image-02" class="size-10" />
              <UButton
                v-if="canSuggest(colorway)"
                label="Add Photo"
                icon="hugeicons:image-add-02"
                size="sm"
                variant="soft"
                :ui="{ label: 'block' }"
                @click.stop="suggest('artisan_colorway', colorway)"
              />
            </div>
          </div>

          <!-- Every action needs a signed-in user; copying lives in the popup -->
          <template v-if="authenticated" #footer>
            <!-- Save on the left with its label, icon-only actions on the
                 right, like keyboard variant cards -->
            <div class="flex w-full flex-wrap items-center gap-2" @click.stop>
              <SharedSaveToCollection
                :item="colorway"
                :item-name="colorway.name"
                label="Save"
                keep-label
                @on-select="saveTo"
              />

              <div class="ms-auto flex items-center gap-1">
                <!-- Staff edit in place; others suggest an edit -->
                <UTooltip
                  v-if="editable || canSuggest(colorway)"
                  text="Edit"
                  :delay-duration="0"
                >
                  <UButton
                    icon="hugeicons:file-edit"
                    variant="ghost"
                    aria-label="Edit"
                    @click="
                      editable
                        ? openColorwayForm(colorway)
                        : suggest('artisan_colorway', colorway)
                    "
                  />
                </UTooltip>

                <template v-if="editable">
                  <UTooltip text="History" :delay-duration="0">
                    <UButton
                      icon="hugeicons:time-quarter-pass"
                      variant="ghost"
                      aria-label="History"
                      @click="showColorwayHistory(colorway)"
                    />
                  </UTooltip>

                  <UTooltip text="Delete" :delay-duration="0">
                    <UButton
                      icon="hugeicons:file-remove"
                      color="error"
                      variant="ghost"
                      aria-label="Delete"
                      @click="
                        openDelete(
                          'Colorway',
                          colorway.name,
                          `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}/colorways/${colorway.id}`,
                        )
                      "
                    />
                  </UTooltip>
                </template>
              </div>
            </div>
          </template>
        </UPageCard>
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
          title="Delete Colorway"
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
const toast = useToast()

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

const deleteSculpt = async (closeModal) => {
  try {
    await $fetch(
      `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}`,
      { method: 'delete' },
    )

    toast.add(
      successToast('delete', { entity: 'Sculpt', name: sculpt.value.name }),
    )

    closeModal()
    navigateTo(`/artisan/maker/${route.params.maker}`)
  } catch (error) {
    toast.add(errorToast(error))
  }
}

const {
  target: deleteTarget,
  deleting,
  open: openDelete,
  confirm: confirmDelete,
} = useConfirmDelete(refresh)
</script>
