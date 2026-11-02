<template>
  <UDashboardPanel id="artisan-makers">
    <template #header>
      <UDashboardNavbar title="Artisan Makers" />
    </template>

    <template #body>
      <UPageHeader
        headline="Artisans"
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
            description="Pin up to 6 makers to the top for easy access."
          >
            <UTooltip text="Customize Pins">
              <UButton icon="hugeicons:pin" aria-label="Customize Pins" />
            </UTooltip>

            <template #body="{ close }">
              <ArtisanModalPinMaker
                :makers="sortedMakers"
                @on-success="close"
              />
            </template>
          </UModal>
        </template>
      </UPageHeader>

      <!-- Pinned makers first, with a pin beside the name -->
      <UPageGrid :class="artisanGridClass">
        <SharedKeebLogoCard
          v-for="maker in sortedMakers"
          :key="maker.maker_id"
          :title="maker.name"
          :to="`/artisan/maker/${maker.maker_id}`"
          :slug="maker.maker_id"
          :invertible="maker.invertible_logo"
          :pinned="isPinned(maker)"
        />
      </UPageGrid>
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
const { authenticated, isAdmin, favorites } = storeToRefs(userStore)

const isPinned = (maker) =>
  authenticated.value && Object.hasOwn(favorites.value, maker.maker_id)

const sortedMakers = computed(() => pinnedFirst(data.value || [], isPinned))
</script>
