<template>
  <KeycapList
    :title="title"
    :description="description"
    :keycaps="data.keycaps"
    :total="data.count"
    :page="page"
    :size="size"
    @update:page="updatePage"
    @update:keycaps="refresh"
  />
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const validStatuses = Object.keys(keycapStatusMap)

const status = computed(() => {
  const s = route.query.status
  return validStatuses.includes(s) ? s : 'live'
})

// redirect invalid or missing → live
if (!route.query.status || !validStatuses.includes(route.query.status)) {
  router.replace({ path: '/keycap', query: { status: status.value } })
}

const page = computed(() => Number(route.query.page) || 1)
const size = 36

const { data, refresh } = await useAsyncData(
  route.path,
  () =>
    $fetch('/api/keycaps', {
      query: { page: page.value, size, status: status.value },
    }),
  {
    watch: [page, size, status],
  },
)

const updatePage = (newPage) => {
  router.push({
    path: '/keycap',
    query: { status: status.value, page: newPage },
  })
}

const title = computed(() => `${keycapStatusMap[status.value]?.title}`)
const description = computed(
  () => `${keycapStatusMap[status.value]?.description}`,
)

useSeoMeta({
  title,
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
