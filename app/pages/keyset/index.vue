<template>
  <UDashboardPanel id="keyset-profiles">
    <template #header>
      <UDashboardNavbar title="Keyset Profiles" />
    </template>

    <template #body>
      <UPageHeader
        headline="Keysets"
        title="Profiles"
        :description="description"
        :ui="listingPageHeaderUi"
      >
        <template #links>
          <UInput
            v-if="groups.length"
            v-model="query"
            icon="hugeicons:search-01"
            placeholder="Filter profiles"
            aria-label="Filter profiles"
            class="w-full sm:w-60"
          />

          <UModal v-if="editable" v-model:open="adding" title="Add Keyset Profile">
            <UButton
              color="primary"
              icon="hugeicons:add-square"
              label="Add Profile"
            />

            <template #body="{ close }">
              <KeysetModalProfileForm
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>
        </template>
      </UPageHeader>

      <template v-if="groups.length">
        <!-- Grouped by keycap profile; the group's name heads it -->
        <section
          v-for="group in matchingGroups"
          :key="group.label"
          class="space-y-4 pt-4"
        >
          <UPageHeader
            :title="group.label"
            :as="detailSectionHeaderAs"
            :ui="detailSectionHeaderUi"
          />

          <UPageGrid :class="artisanGridClass">
            <SharedKeebLogoCard
              v-for="item in group.profiles"
              :key="item.id"
              :title="item.name"
              :to="`/keyset/${item.id}`"
              :slug="item.id"
              invertible
            />
          </UPageGrid>
        </section>

        <UEmpty
          v-if="!matchingGroups.length"
          icon="hugeicons:search-remove"
          title="No Profiles Match"
          :description="`Nothing matches “${query}”. Try a shorter name, or the manufacturer's.`"
          :actions="[
            {
              label: 'Clear Filter',
              icon: 'hugeicons:cancel-01',
              ui: { label: 'block' },
              onClick: () => (query = ''),
            },
          ]"
        />
      </template>

      <UEmpty
        v-else-if="status !== 'pending'"
        icon="hugeicons:cross"
        title="No Profiles Yet"
        description="Submit a keyset to add the first profile to the dex."
        :actions="[
          {
            label: 'Submit a Keyset',
            icon: 'hugeicons:add-circle',
            to: '/keyset/submissions/submit',
            ui: { label: 'block' },
          },
        ]"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
// Legacy `/keyset?status=…` links point at the group buy tabs.
definePageMeta({
  middleware: [
    (to) => {
      if (to.query.status) {
        return navigateTo(
          { path: '/keyset/group-buy', query: to.query },
          { redirectCode: 301 },
        )
      }
    },
  ],
})

const description =
  'Browse keycap profiles and manufacturers, then drill into each catalog of keysets.'

useSeoMeta({
  title: 'Keyset Profiles',
  description,
})

const userStore = useUserStore()
// Admins and editors without assignments (nobody is assigned a profile).
const editable = computed(() => userStore.isEditable('keyset'))
const adding = ref(false)
const query = ref('')

const { groupedProfiles, status, refresh } = useKeysetProfiles()

const groups = computed(() =>
  Object.entries(groupedProfiles.value).map(([label, items]) => ({
    label,
    profiles: Object.entries(items).map(([id, name]) => ({ id, name })),
  })),
)

// The filter keeps groups that still have a match
const matchingGroups = computed(() =>
  groups.value
    .map((group) => ({
      ...group,
      profiles: filterByName(group.profiles, query.value),
    }))
    .filter((group) => group.profiles.length),
)
</script>
