<template>
  <UDashboardPanel
    v-if="data && editable"
    :id="`keyboard-${brand}-${keyboard}-sort`"
  >
    <template #header>
      <UDashboardNavbar :title="data.keyboard.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UButton
            label="Save Custom Sorting"
            icon="hugeicons:bookmark-03"
            loading-auto
            @click="saveCustomSorting"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <UAlert
          :icon="appConfig.ui.icons.sortManual"
          title="Click and drag releases to rearrange display order."
          description="Don't forget to save your custom sort before leaving the page — changes won't be saved automatically!"
          color="info"
        />
      </div>

      <draggable
        v-if="items.length"
        :list="items"
        item-key="id"
        group="group"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <template #item="{ element: item }">
          <div class="cursor-move">
            <UPageCard
              :title="item.name"
              reverse
              spotlight
              :ui="{
                root: 'h-full',
                wrapper: 'flex-1',
              }"
            >
              <NuxtImg
                loading="lazy"
                :alt="item.name"
                :src="item.cover_image || '/keyboard.png'"
                class="aspect-video w-full object-cover"
              />
            </UPageCard>
          </div>
        </template>
      </draggable>

      <UAlert
        v-else
        title="No releases yet"
        description="Add releases to this keyboard before using manual sorting."
        icon="hugeicons:information-circle"
        color="info"
      />
    </template>
  </UDashboardPanel>

  <SharedRedirectPage v-else :to="`/keyboard/brand/${brand}/${keyboard}`" />
</template>

<script setup>
import draggable from 'vuedraggable'

const appConfig = useAppConfig()
const toast = useToast()
const route = useRoute()
const userStore = useUserStore()

const brand = computed(() => String(route.params.brand || ''))
const keyboard = computed(() => String(route.params.keyboard || ''))
const editable = computed(() =>
  userStore.isEditable(`${brand.value}/${keyboard.value}`),
)

const { data, refresh } = await useAsyncData(
  () => `keyboard-release-sort:${brand.value}/${keyboard.value}`,
  () => $fetch(`/api/keyboards/${brand.value}/${keyboard.value}`),
  {
    watch: [brand, keyboard],
  },
)

const items = ref([])

watch(
  () => data.value?.releases,
  (releases) => {
    items.value = (releases || []).map((release) => ({
      ...release,
      cover_image: release.variants?.find((variant) => variant.image_url)
        ?.image_url,
    }))
  },
  { immediate: true },
)

const breadcrumbs = computed(() => {
  return [
    {
      label: 'Brands',
      icon: 'hugeicons:user-group-03',
      to: '/keyboard/brand',
    },
    {
      label: data.value?.brand?.name,
      to: `/keyboard/brand/${brand.value}`,
    },
    {
      label: data.value?.keyboard?.name,
      to: `/keyboard/brand/${brand.value}/${keyboard.value}`,
    },
    {
      label: 'Manual Sorting',
    },
  ]
})

const saveCustomSorting = async () => {
  const total = items.value.length

  await $fetch(
    `/api/keyboards/${brand.value}/${keyboard.value}/releases/sort`,
    {
      method: 'post',
      body: items.value.map(({ id }, idx) => ({
        order: total - idx,
        id,
      })),
    },
  )
    .then(() => {
      refresh()
      toast.add(handleNotice('order_save'))
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
