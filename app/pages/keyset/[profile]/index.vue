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
    <template #actions>
      <template v-if="editable && data?.profile">
        <UModal v-model:open="editing" title="Edit Profile">
          <UButton icon="hugeicons:edit-01" label="Edit" />

          <template #body="{ close }">
            <KeysetModalProfileForm
              :metadata="data.profile"
              :is-edit="true"
              @on-success="
                () => {
                  close()
                  refresh()
                }
              "
            />
          </template>
        </UModal>

        <SharedRevisionHistory
          domain="keyset"
          :parent-key="profile"
          description="Every change to this profile, newest first. Its keysets keep their own history."
          @reverted="refresh()"
        />
      </template>

      <UButton
        v-else-if="canSuggest(data?.profile)"
        label="Edit"
        icon="hugeicons:edit-01"
        @click="suggest('keyset_profile', data.profile)"
      />

      <SharedSuggestEditModal
        v-if="suggestTarget"
        v-model:open="suggestOpen"
        :entity-type="suggestTarget.entityType"
        :record="suggestTarget.record"
        :form-props="suggestTarget.formProps"
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
// assignments edit it and see its history; everyone else signed in suggests
// edits.
const editable = computed(() => userStore.isEditable(profile))
const editing = ref(false)

const {
  target: suggestTarget,
  open: suggestOpen,
  canSuggest,
  suggest,
} = useSuggestEdit(editable)

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
