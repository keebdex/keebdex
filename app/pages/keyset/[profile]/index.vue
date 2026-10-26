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
  >
    <template v-if="editable" #actions>
      <SharedRevisionHistory
        domain="keyset"
        :parent-key="profile"
        description="Every change to this profile, newest first. Its keysets keep their own history."
        @reverted="refresh()"
      />
    </template>
  </KeysetListing>
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()
const { manufacturers } = useKeysetProfiles()

const { profile } = route.params

// Nobody is assigned a profile, so only admins and editors without
// assignments see its history.
const editable = computed(() => userStore.isEditable(profile))

const { page, size, setPage } = usePagination(36)

const query = computed(() => {
  return {
    // The profile list may still be loading during SSR; the API 404s on an
    // unknown profile, so pass the route param as is
    profile_id: profile,
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

const title = computed(
  () => keysetProfileLabel(data.value?.profile) || manufacturers.value[profile],
)
const description = computed(() => data.value?.profile?.description)

useSeoMeta({
  title: computed(() => (title.value ? `${title.value} Keysets` : 'Keysets')),
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
