<template>
  <UDashboardPanel v-if="data?.profile" :id="`keyset-profile-${profile}`">
    <template #header>
      <UDashboardNavbar :title="title">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <SharedOwnerHero
        :title="title"
        :slug="profile"
        invertible
        :description="description"
        :specs="profileSpecs"
        details-label="Profile Details"
      >
        <template v-if="authenticated" #actions>
          <UButton
            color="primary"
            icon="hugeicons:keyboard"
            label="Add Keyset"
            v-bind="addKeysetTarget"
          />

          <SharedRecordActions
            :editable="editable"
            :suggestable="canSuggest(data.profile)"
            label="Profile"
            @edit="editing = true"
            @suggest="suggest('keyset_profile', data.profile)"
            @history="history?.show()"
          />
        </template>
      </SharedOwnerHero>

      <section class="pt-4">
        <KeysetGrid
          :keysets="keysets"
          :total="data.count"
          :page="page"
          :size="size"
          @update:page="setPage"
        >
          <template #empty>
            <UEmpty
              icon="hugeicons:keyboard"
              title="No Keysets Yet"
              description="Know a set in this profile? Submit it and our staff will review it before it goes public."
              :actions="[
                {
                  label: 'Add Keyset',
                  icon: 'hugeicons:add-square',
                  ui: { label: 'block' },
                  to: {
                    path: '/keyset/submissions/submit',
                    query: { profile },
                  },
                },
              ]"
            />
          </template>
        </KeysetGrid>
      </section>

      <template v-if="editable">
        <SharedRevisionHistory
          ref="history"
          domain="keyset"
          :parent-key="profile"
          description="Every change to this profile, newest first. Its keysets keep their own history."
          @reverted="refresh()"
        />

        <UModal v-model:open="addingKeyset" title="Add Keyset">
          <template #body>
            <KeysetModalKeysetForm
              :metadata="{ profile_id: profile }"
              @on-success="
                () => {
                  addingKeyset = false
                  refresh()
                }
              "
            />
          </template>
        </UModal>

        <UModal v-model:open="editing" title="Edit Profile">
          <template #body>
            <KeysetModalProfileForm
              :metadata="data.profile"
              is-edit
              @on-success="
                () => {
                  editing = false
                  refresh()
                }
              "
            />
          </template>
        </UModal>
      </template>

      <SharedSuggestEditModal
        v-if="suggestTarget"
        v-model:open="suggestOpen"
        :entity-type="suggestTarget.entityType"
        :record="suggestTarget.record"
        :form-props="suggestTarget.formProps"
      />
    </template>
  </UDashboardPanel>
  <SharedRedirectPage v-else to="/keyset" />
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()
const { authenticated } = storeToRefs(userStore)
const { manufacturers } = useKeysetProfiles()

const { profile } = route.params

// Nobody is assigned a profile, so only admins and editors without
// assignments edit it and see its history; everyone else signed in suggests
// edits.
const editable = computed(() => userStore.isEditable(profile))
const editing = ref(false)
const addingKeyset = ref(false)
const history = useTemplateRef('history')

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

// Staff add a keyset in place; everyone else goes to the submission wizard
const addKeysetTarget = computed(() =>
  submissionTarget(
    editable.value,
    () => (addingKeyset.value = true),
    'keyset',
    { profile },
  ),
)

const profileSpecs = computed(() =>
  [
    {
      term: 'Profile',
      icon: 'hugeicons:layers-01',
      description: data.value?.profile?.profile,
    },
    {
      term: 'Manufacturer',
      icon: 'hugeicons:factory',
      description: data.value?.profile?.manufacturer,
    },
  ].filter((spec) => spec.description),
)

const breadcrumbs = computed(() => [
  {
    label: 'Profiles',
    icon: 'hugeicons:cross',
    to: '/keyset',
  },
  {
    label: title.value,
  },
])

useSeoMeta({
  title: computed(() => (title.value ? `${title.value} Keysets` : 'Keysets')),
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
