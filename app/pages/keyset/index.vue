<template>
  <UDashboardPanel id="keyset-profiles">
    <template #header>
      <UDashboardNavbar title="Keyset Profiles" />
    </template>

    <template #body>
      <UPageHeader
        headline="Keysets"
        title="Profiles by Manufacturer"
        :description="description"
        :ui="listingPageHeaderUi"
      >
        <template #links>
          <UModal v-if="editable" title="Add Keyset Profile">
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

      <!-- One card per manufacturer, its logo shown once: sets are named
           after the maker and the profile (GMK CYL), and one maker can make
           several profiles. A maker with one profile links straight to it;
           one with several opens a picker of them. -->
      <UPageGrid v-if="makers.length" :class="artisanGridClass">
        <template v-for="maker in makers" :key="maker.id">
          <SharedKeebLogoCard
            v-if="maker.profiles.length === 1"
            :title="maker.name"
            :slug="maker.id"
            :to="`/keyset/${maker.profiles[0].profile_id}`"
            invertible
          />

          <UModal
            v-else
            :title="maker.name"
            description="Pick a profile to see its keysets."
          >
            <SharedKeebLogoCard
              :title="maker.name"
              :slug="maker.id"
              invertible
              class="cursor-pointer"
            />

            <template #body>
              <!-- One row across the modal: two columns, three from three
                   profiles (a plain grid: `UPageGrid`'s columns follow the
                   screen, not the modal). The theme's modal body has no top
                   padding (`body: '!pt-0'`) and scrolls, which would clip the
                   cards' top rings; `p-0.5` keeps them clear. -->
              <div
                class="grid grid-cols-2 gap-3 p-0.5"
                :class="maker.profiles.length > 2 && 'sm:grid-cols-3'"
              >
                <UPageCard
                  v-for="item in maker.profiles"
                  :key="item.profile_id"
                  :to="`/keyset/${item.profile_id}`"
                  :title="item.name"
                  :description="
                    item.profile && item.profile !== item.name
                      ? item.profile
                      : undefined
                  "
                  variant="subtle"
                  spotlight
                  :ui="{ title: 'truncate' }"
                />
              </div>
            </template>
          </UModal>
        </template>
      </UPageGrid>

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
import { groupBy } from 'es-toolkit'
import { sortBy } from 'es-toolkit/compat'

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

// Sets go by who makes them and the profile (GMK CYL), so the page lists
// manufacturers rather than profiles
const description =
  'Keysets go by their manufacturer and keycap profile, like GMK CYL. Pick a manufacturer to browse its keysets, or choose a profile when it makes more than one.'

useSeoMeta({
  title: 'Keyset Profiles',
  description,
})

const userStore = useUserStore()
// Admins and editors without assignments (nobody is assigned a profile).
const editable = computed(() => userStore.isEditable('keyset'))
const { profiles, status, refresh } = useKeysetProfiles()

// Profiles under their manufacturer (keyed like its logo, so a profile
// without one stands alone), both by name
const makers = computed(() =>
  sortBy(
    Object.entries(groupBy(profiles.value, keysetProfileLogoKey)).map(
      ([id, items]) => ({
        id,
        name: items[0].manufacturer || items[0].name,
        profiles: sortBy(items, (item) => item.name.toLowerCase()),
      }),
    ),
    (maker) => maker.name.toLowerCase(),
  ),
)
</script>
