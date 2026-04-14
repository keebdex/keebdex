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
              :ui="{ content: 'min-w-fit' }"
            />

            <SharedProfileDrawer
              v-if="sculpt.story"
              :title="sculpt.name"
              :description="sculpt.story"
              :links="sculptLinks"
            />

            <UModal
              title="Delete Sculpt"
              :description="`Are you sure you want to delete ${sculpt.name}? This action cannot be undone.`"
              :ui="{ footer: 'justify-end', content: 'divide-none' }"
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
          :ui="{ content: 'min-w-fit' }"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageGrid>
        <UPageCard
          v-for="colorway in sculpt.colorways"
          :key="colorway.colorway_id"
          :title="colorway.name"
          reverse
          spotlight
          :ui="{
            root: 'h-full flex flex-col',
            container: 'h-full grid grid-rows-[auto_minmax(0,1fr)]',
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
            <UModal v-if="editable" title="Edit Colorway">
              <UTooltip text="Edit" :delay-duration="0">
                <UButton
                  icon="hugeicons:file-edit"
                  @click="setSelectedColorway(colorway)"
                />
              </UTooltip>

              <template #body="{ close }">
                <ArtisanModalColorwayForm
                  :metadata="selectedColorway"
                  @on-success="
                    () => {
                      close()
                      refresh()
                      clearSelectedColorway()
                    }
                  "
                />
              </template>
            </UModal>

            <UModal
              v-model:visible="visible.card"
              :ui="{
                content: 'max-w-xl',
              }"
            >
              <UTooltip text="Expand" :delay-duration="0">
                <UButton
                  icon="hugeicons:zoom-in-area"
                  @click="setSelectedColorway(colorway)"
                />
              </UTooltip>

              <template #content>
                <ArtisanColorwayCard
                  :colorway="selectedColorway"
                  :editable="editable"
                  :authenticated="authenticated"
                  @save-to="saveTo"
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
              :ui="{ footer: 'justify-end', content: 'divide-none' }"
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
          </template>
        </UPageCard>
      </UPageGrid>

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

const editable = computed(() => userStore.isEditable(sculpt.value.maker_id))

const visible = ref({
  edit: false,
  create: false,
  card: false,
})

const { addItem } = useCollectionItem()

// add to collection
const saveTo = (collection, colorway) => {
  addItem(collection, { artisan_item_id: colorway.id }, colorway.name)
}

const sculptLinks = computed(() => {
  if (!sculpt.value?.href) {
    return []
  }

  return [
    {
      label: 'Website',
      icon: 'hugeicons:globe-02',
      to: sculpt.value.href,
      target: '_blank',
    },
  ]
})

// colorway submission
const newColorwayMetadata = computed(() => ({
  maker_id: sculpt.value.maker_id,
  sculpt_id: sculpt.value.sculpt_id,
  maker_sculpt_id: sculpt.value.maker_sculpt_id,
  currency: 'USD',
  sale_type: 'Raffle',
  order: (sculpt.value.total_colorways || 0) + 1,
}))

// show colorway card popup
const selectedColorway = ref({})
const clearSelectedColorway = () => {
  selectedColorway.value = {}
}
const setSelectedColorway = (clw) => {
  const { colorways, ...rest } = sculpt.value
  selectedColorway.value = {
    ...clw,
    sculpt: rest,
  }
}

const toggleColorwayCard = () => {
  const clw = sculpt.value.colorways.find(
    (c) => c.colorway_id === route.query.cid,
  )
  if (clw) {
    setSelectedColorway(clw)
    visible.value.card = !visible.value.card
  }
}

watch(
  () => route.query.cid,
  () => {
    toggleColorwayCard()
  },
  { immediate: true },
)

// delete sculpt
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

// delete colorway
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
