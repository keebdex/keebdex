<template>
  <KeycapList
    :title="title"
    :description="description"
    :keycaps="data.keycaps"
    :total="data.count"
    :profile="data.profile"
    :page="page"
    :size="size"
    @update:page="updatePage"
    @update:keycaps="refresh"
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
  () => $fetch('/api/keycaps', { query: query.value }),
  {
    watch: [page, size],
  },
)

const title = manufacturers[profile]
const description = data.value?.profile?.description

function updatePage(newPage) {
  router.push({
    path: `/keycap/${profile}`,
    query: { page: newPage },
  })
}

useSeoMeta({
  title,
  description,
  ogDescription: description,
  twitterDescription: description,
})

defineOgImage({
  component: 'Keycap',
  props: {
    manufacturerId: profile,
  },
})
</script>
