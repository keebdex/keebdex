<template>
  <UDashboardPanel id="keyboard-brands">
    <template #header>
      <UDashboardNavbar title="Keyboard Brands" />
    </template>

    <template #body>
      <UPageHeader
        headline="Keyboards"
        title="Brands"
        :description="description"
        :ui="listingPageHeaderUi"
      >
        <template #links>
          <UModal v-if="editable" title="Add Keyboard Brand">
            <UButton color="primary" icon="hugeicons:add-team" label="Add Brand" />

            <template #body="{ close }">
              <KeyboardModalBrandForm
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
            description="Pin brands to keep them at the top of the list."
          >
            <UTooltip text="Customize Pins">
              <UButton icon="hugeicons:pin" aria-label="Customize Pins" />
            </UTooltip>

            <template #body="{ close }">
              <SharedPinForm
                :items="brands.all"
                value-key="slug"
                logos
                :selected="brands.pinned.map((brand) => brand.slug)"
                :save="(ids) => userStore.savePinnedOwners('keyboard', ids)"
                @on-success="close"
              />
            </template>
          </UModal>
        </template>
      </UPageHeader>

      <!-- Pinned brands get a group of their own above the rest; without
           pins the list follows the header directly -->
      <section
        v-for="(group, index) in brands.groups"
        :key="group.label"
        :class="['space-y-3', index ? 'pt-8' : 'pt-4']"
      >
        <SharedPinGroupLabel v-if="brands.pinned.length" :pinned="group.pinned">
          {{ group.label }}
        </SharedPinGroupLabel>

        <UPageGrid :class="artisanGridClass">
          <SharedKeebLogoCard
            v-for="brand in group.items"
            :key="brand.slug"
            :title="brand.name"
            :to="`/keyboard/brand/${brand.slug}`"
            :slug="brand.slug"
            :invertible="brand.invertible_logo"
          />
        </UPageGrid>
      </section>

      <UEmpty
        v-if="!brands.all.length"
        icon="hugeicons:keyboard"
        title="No Brands Yet"
        description="Submit a keyboard to add the first brand to the dex."
        :actions="[
          {
            label: 'Submit a Keyboard',
            icon: 'hugeicons:add-circle',
            to: '/keyboard/submissions/submit',
            ui: { label: 'block' },
          },
        ]"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
const description =
  'Browse keyboard brands, then drill into each catalog of boards, releases, and variants.'

useSeoMeta({
  title: 'Keyboard Brands',
  description,
})

// The grid only reads these; bios and links stay on the brand page
const { data, refresh } = await useAsyncData(
  'keyboard-brands',
  () => $fetch('/api/keyboards/brands'),
  {
    transform: (brands) =>
      brands.map(({ slug, name, invertible_logo }) => ({
        slug,
        name,
        invertible_logo,
      })),
  },
)

const userStore = useUserStore()
const { authenticated, pinnedBrands } = storeToRefs(userStore)
const editable = computed(() => userStore.isEditable('keyboard'))

const isPinned = (brand) =>
  authenticated.value && Object.hasOwn(pinnedBrands.value, brand.slug)

const brands = computed(() => splitPinned(data.value || [], isPinned))
</script>
