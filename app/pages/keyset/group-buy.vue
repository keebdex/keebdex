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
        <UTabs
          v-model="status"
          :items="tabs"
          :content="false"
          variant="link"
          size="sm"
        />
      </UDashboardToolbar>
    </template>
  </KeysetListing>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const validStatuses = Object.keys(keysetStatusMap)

const tabs = Object.entries(keysetStatusMap).map(([value, meta]) => ({
  label: meta.title,
  icon: meta.icon,
  value,
}))

const status = computed({
  get: () => {
    const s = route.query.status
    return validStatuses.includes(s) ? s : 'live'
  },
  set: (value) => {
    router.replace({ query: { ...route.query, status: value, page: undefined } })
  },
})

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
