<template>
  <KeysetListing
    :title="title"
    :description="description"
    :keysets="keysets"
    :total="data?.count"
    :profile="data?.profile"
    :page="page"
    :size="size"
    @update:page="setPage"
    @update:keysets="refresh"
  />
</template>

<script setup>
const route = useRoute()
const { manufacturers } = useKeysetProfiles()

const { profile } = route.params

const { page, size, setPage } = usePagination(36)

const query = computed(() => {
  return {
    profile_id: manufacturers.value[profile] && profile,
    page: page.value,
    size,
  }
})

const { data, refresh } = await useAsyncData(
  route.path,
  () => $fetch('/api/keysets', { query: query.value }),
  {
    watch: [page],
  },
)

const keysets = computed(() => data.value?.keysets || [])

const title = computed(() => manufacturers.value[profile])
const description = data.value?.profile?.description

useSeoMeta({
  title: title.value,
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
