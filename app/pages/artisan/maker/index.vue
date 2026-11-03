<template>
  <UDashboardPanel id="artisan-makers">
    <template #header>
      <UDashboardNavbar title="Artisans" />
    </template>

    <template #body>
      <UPageHeader
        title="Makers"
        :description="description"
        :ui="listingPageHeaderUi"
      >
        <template #links>
          <UModal v-if="isAdmin" title="Add Maker">
            <UButton color="primary" icon="hugeicons:add-team" label="Add Maker" />

            <template #body="{ close }">
              <ArtisanModalMakerForm
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>

          <UModal
            v-if="authenticated"
            title="Customize Pins"
            description="Pin makers to keep them at the top of the list."
          >
            <UTooltip text="Customize Pins">
              <UButton icon="hugeicons:pin" aria-label="Customize Pins" />
            </UTooltip>

            <template #body="{ close }">
              <SharedPinForm
                :items="makers.all"
                value-key="maker_id"
                logos
                :selected="makers.pinned.map((maker) => maker.maker_id)"
                :save="(ids) => userStore.savePinnedOwners('artisan', ids)"
                @on-success="close"
              />
            </template>
          </UModal>
        </template>
      </UPageHeader>

      <!-- Pinned makers get a group of their own above the rest; without
           pins the list follows the header directly -->
      <section
        v-for="(group, index) in makers.groups"
        :key="group.label"
        :class="['space-y-3', index ? 'pt-8' : 'pt-4']"
      >
        <SharedPinGroupLabel v-if="makers.pinned.length" :pinned="group.pinned">
          {{ group.label }}
        </SharedPinGroupLabel>

        <UPageGrid :class="artisanGridClass">
          <SharedKeebLogoCard
            v-for="maker in group.items"
            :key="maker.maker_id"
            :title="maker.name"
            :to="`/artisan/maker/${maker.maker_id}`"
            :slug="maker.maker_id"
            :invertible="maker.invertible_logo"
          />
        </UPageGrid>
      </section>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const description =
  'Every artisan maker in the dex, from long-running studios to new names. Pick one to browse their sculpts and colorways.'

useSeoMeta({
  title: 'Artisan Makers',
  description,
})

// The grid and the pin modal only read these; the full rows (bios,
// contributors, links) would triple the SSR payload
const { data, refresh } = await useAsyncData(
  'artisan-makers',
  () => $fetch('/api/makers'),
  {
    transform: (makers) =>
      makers.map(({ maker_id, name, invertible_logo }) => ({
        maker_id,
        name,
        invertible_logo,
      })),
  },
)

const userStore = useUserStore()
const { authenticated, isAdmin, pinnedMakers } = storeToRefs(userStore)

const isPinned = (maker) =>
  authenticated.value && Object.hasOwn(pinnedMakers.value, maker.maker_id)

const makers = computed(() => splitPinned(data.value || [], isPinned))
</script>
