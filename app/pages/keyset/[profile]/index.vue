<template>
  <KeysetListing
    :title="title"
    :description="description"
    :keysets="keysets"
    :total="data?.count"
    :profile="data?.profile"
    :page="page"
    :size="size"
    @update:page="updatePage"
    @update:keysets="refresh"
  />
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const { profile } = route.params

const page = computed(() => Number(route.query.page) || 1)
const size = ref(36)

const query = computed(() => {
  return {
    profile_id: manufacturers[profile] && profile,
    page: page.value,
    size: size.value,
  }
})

const { data, refresh } = await useAsyncData(
  route.path,
  () => $fetch('/api/keysets', { query: query.value }),
  {
    watch: [page, size],
  },
)

const keysets = computed(() => data.value?.keysets || [])

const title = manufacturers[profile]
const description = data.value?.profile?.description

const updatePage = (newPage) => {
  router.push({
    path: `/keyset/${profile}`,
    query: { page: newPage },
  })
}

useSeoMeta({
  title,
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
