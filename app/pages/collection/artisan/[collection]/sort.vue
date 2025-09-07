<template>
  <UDashboardPanel :id="`collection-${route.params.collection}-sort`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHeader :title="`Sorting - ${data?.name}`">
        <template #description>
          <UAlert
            icon="hugeicons:sorting-05"
            title="Click and drag any card to rearrange them in your preferred order."
            description="Don’t forget to save your custom sort before leaving the page — changes won’t be saved automatically!"
            variant="soft"
            color="info"
          />
        </template>

        <template #links>
          <UButton
            label="Save Custom Sorting"
            icon="hugeicons:bookmark-03"
            loading-auto
            @click="saveCustomSorting"
          />
        </template>
      </UPageHeader>

      <draggable
        :list="items"
        item-key="id"
        group="group"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 4xl:grid-cols-9 gap-4"
      >
        <template #item="{ element: item }">
          <div class="cursor-move">
            <UPageCard
              :title="item.artisan.name"
              :description="item.artisan?.sculpt.name"
              reverse
              spotlight
              :ui="{
                root: 'h-full',
                wrapper: 'flex-1',
              }"
            >
              <div class="relative aspect-square overflow-hidden">
                <NuxtImg
                  loading="lazy"
                  :alt="item.artisan.name"
                  :src="item.artisan.img"
                  class="w-full h-full object-cover rounded"
                  :class="{
                    grayscale: !item.exchange,
                  }"
                />
              </div>
            </UPageCard>
          </div>
        </template>
      </draggable>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import sortBy from 'lodash.sortby'
import draggable from 'vuedraggable'

const toast = useToast()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const route = useRoute()

const { data, refresh } = await useAsyncData(
  () => $fetch(`/api/collections/${route.params.collection}`),
  {
    transform: (data) => {
      data.items = sortBy(data.items, 'order')

      return data
    },
  },
)

const items = ref(data.value?.items || [])

useSeoMeta({
  title: data.value?.name
    ? `${data.value.name} • Sorting Collection`
    : 'Collection',
})

watchEffect(() => route.params.collection, refresh())

const breadcrumbs = computed(() => {
  return [
    {
      label: 'My Collection',
      icon: 'hugeicons:collections-bookmark',
      to: '/collection',
    },
    {
      label: data.value?.name,
      to: `/collection/artisan/${route.params.collection}`,
    },
    {
      label: 'Sorting',
    },
  ]
})

const saveCustomSorting = async () => {
  await $fetch(
    `/api/users/${user.value.uid}/collections/${route.params.collection}/sort`,
    {
      method: 'post',
      body: items.value.map(({ id }, idx) => ({
        order: idx,
        id,
      })),
    },
  )
    .then(() => {
      refresh()
      toast.add({
        color: 'success',
        title: 'Custom order saved successfully!',
      })
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })

  await $fetch(
    `/api/users/${user.value.uid}/collections/${route.params.collection}`,
    {
      method: 'post',
      body: {
        sort_by: 'order|asc',
      },
    },
  ).catch((error) => {
    toast.add({ color: 'error', title: error.message })
  })
}
</script>
