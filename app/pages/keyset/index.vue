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
  />
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const validStatuses = Object.keys(keysetStatusMap)

const status = computed(() => {
  const s = route.query.status
  return validStatuses.includes(s) ? s : 'live'
})

// redirect invalid or missing → live
if (!route.query.status || !validStatuses.includes(route.query.status)) {
  router.replace({ path: '/keyset', query: { status: status.value } })
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

const title = computed(() => `${keysetStatusMap[status.value]?.title}`)
const description = computed(
  () => `${keysetStatusMap[status.value]?.description}`,
)

useSeoMeta({
  title,
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
