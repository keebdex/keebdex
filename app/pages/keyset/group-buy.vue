<template>
  <KeysetListing
    :title="title"
    :description="description"
    :keysets="data.keysets"
    :total="data.count"
    :page="page"
    :size="size"
    @update:page="setPage"
    @update:keysets="refresh"
  >
    <template #toolbar>
      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>
  </KeysetListing>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const validStatuses = Object.keys(keysetStatusMap)

const status = computed(() => {
  const s = route.query.status
  return validStatuses.includes(s) ? s : 'live'
})

const links = computed(() =>
  Object.entries(keysetStatusMap).map(([value, meta]) => ({
    label: meta.label,
    icon: meta.icon,
    to: { path: route.path, query: { status: value } },
    active: status.value === value,
  })),
)

// redirect invalid or missing → live
if (!validStatuses.includes(route.query.status)) {
  router.replace({ query: { ...route.query, status: status.value } })
}

const { page, size, setPage } = usePagination(36)

const { data, refresh } = await useAsyncData(
  route.path,
  () =>
    $fetch('/api/keysets', {
      query: { page: page.value, size, status: status.value },
    }),
  {
    watch: [page, status],
  },
)

const title = 'Group Buys'
const description = computed(
  () => `${keysetStatusMap[status.value]?.description}`,
)

useSeoMeta({
  title: computed(() => `${keysetStatusMap[status.value]?.title}`),
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
