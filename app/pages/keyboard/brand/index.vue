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
        </template>
      </UPageHeader>

      <UPageGrid v-if="brands.length" :class="artisanGridClass">
        <SharedKeebLogoCard
          v-for="brand in brands"
          :key="brand.slug"
          :title="brand.name"
          :to="`/keyboard/brand/${brand.slug}`"
          :slug="brand.slug"
          :invertible="brand.invertible_logo"
        />
      </UPageGrid>

      <UEmpty
        v-else
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
const editable = computed(() => userStore.isEditable('keyboard'))


const brands = computed(() => data.value || [])
</script>
