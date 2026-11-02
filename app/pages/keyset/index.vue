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

      <!-- One card per manufacturer, its logo shown once: sets are named
           after the maker and the profile (GMK CYL), and one maker can make
           several profiles. A maker with one profile links straight to it;
           one with several opens a picker. -->
      <UPageGrid v-if="manufacturers.length" :class="artisanGridClass">
        <SharedKeebLogoCard
          v-for="maker in manufacturers"
          :key="maker.id"
          :title="maker.name"
          :slug="maker.id"
          :to="
            maker.profiles.length === 1
              ? `/keyset/${maker.profiles[0].profile_id}`
              : undefined
          "
          invertible
          :class="maker.profiles.length > 1 && 'cursor-pointer'"
          @click="maker.profiles.length > 1 && (picking = maker)"
        />
      </UPageGrid>

      <!-- The profiles of a maker with several -->
      <UModal
        :open="!!picking"
        :title="picking?.name"
        description="Pick a profile to see its keysets."
        @update:open="(open) => !open && (picking = null)"
      >
        <template #body>
          <!-- One row across the modal: two columns, three from three
               profiles (a plain grid: `UPageGrid`'s columns follow the screen,
               not the modal). The padding keeps the cards' rings clear of the
               modal body's scroll edge, which would clip their top. -->
          <div
            class="grid grid-cols-2 gap-3 p-0.5"
            :class="picking?.profiles.length > 2 && 'sm:grid-cols-3'"
          >
            <UPageCard
              v-for="item in picking?.profiles"
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

      <UEmpty
        v-if="!manufacturers.length && status !== 'pending'"
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
const adding = ref(false)
// The maker whose profiles the picker shows
const picking = ref(null)

const { profiles, status, refresh } = useKeysetProfiles()

// Profiles under their manufacturer (by its logo key; a profile without one
// stands alone), both by name
const manufacturers = computed(() => {
  const byMaker = {}

  for (const item of profiles.value) {
    const id = item.manufacturer_id || item.profile_id

    byMaker[id] ??= { id, name: item.manufacturer || item.name, profiles: [] }
    byMaker[id].profiles.push(item)
  }

  return sortBy(Object.values(byMaker), (maker) => maker.name.toLowerCase()).map(
    (maker) => ({
      ...maker,
      profiles: sortBy(maker.profiles, (item) => item.name.toLowerCase()),
    }),
  )
})
</script>
