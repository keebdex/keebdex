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
        <template v-if="editable" #links>
          <UModal v-model:open="adding" title="Add Keyboard Brand">
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

      <section v-if="brands.length" class="space-y-4 pt-4">
        <UPageHeader
          title="All Brands"
          :description="countLabel(matching.length, 'brand')"
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        >
          <template #links>
            <UInput
              v-model="query"
              icon="hugeicons:search-01"
              placeholder="Filter brands"
              aria-label="Filter brands"
              class="w-40 sm:w-60"
            />
          </template>
        </UPageHeader>

        <UPageGrid v-if="matching.length" :class="logoGridClass">
          <SharedKeebLogoCard
            v-for="brand in matching"
            :key="brand.slug"
            :title="brand.name"
            :description="countryName(brand.country_origin)"
            :to="`/keyboard/brand/${brand.slug}`"
            :slug="brand.slug"
            :invertible="brand.invertible_logo"
            aspect="video"
          />
        </UPageGrid>

        <UEmpty
          v-else
          icon="hugeicons:search-remove"
          title="No Brands Match"
          :description="`Nothing matches “${query}”. Try a shorter name, or submit the brand with one of its keyboards.`"
          :actions="[
            {
              label: 'Clear Filter',
              icon: 'hugeicons:cancel-01',
              ui: { label: 'block' },
              onClick: () => (query = ''),
            },
            {
              label: 'Submit a Keyboard',
              icon: 'hugeicons:add-circle',
              to: '/keyboard/submissions/submit',
              ui: { label: 'block' },
            },
          ]"
        />
      </section>

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
      brands.map(({ slug, name, invertible_logo, country_origin }) => ({
        slug,
        name,
        invertible_logo,
        country_origin,
      })),
  },
)

const userStore = useUserStore()
const editable = computed(() => userStore.isEditable('keyboard'))

const adding = ref(false)
const query = ref('')

const brands = computed(() => data.value || [])
const matching = computed(() => filterByName(brands.value, query.value))
</script>
