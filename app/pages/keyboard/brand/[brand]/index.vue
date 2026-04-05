<template>
  <UDashboardPanel v-if="data" :id="`keyboard-brand-${brand}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="editable"
            v-model:visible="visible.createKeyboard"
            title="Add Keyboard"
          >
            <UButton
              color="primary"
              icon="hugeicons:dashboard-square-add"
              label="Add Keyboard"
            />

            <template #body="{ close }">
              <KeyboardModalKeyboardForm
                :brand-slug="brand"
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
            v-if="editable"
            v-model:visible="visible.editBrand"
            title="Edit Brand"
          >
            <UButton icon="hugeicons:user-edit-01" label="Edit" />

            <template #body="{ close }">
              <KeyboardModalBrandForm
                :metadata="data"
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
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <KeyboardBrandPageHeader :brand="data" />

      <UPageGrid
        v-if="data.keyboards?.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-6 gap-4"
      >
        <UPageCard
          v-for="keyboard in data.keyboards"
          :key="keyboard.slug"
          :to="`/keyboard/brand/${brand}/${keyboard.slug}`"
          :title="keyboard.name"
          :description="keyboard.description"
          icon="hugeicons:keyboard"
          reverse
          spotlight
        >
          <template #leading>
            <UBadge
              v-if="keyboard.layout"
              :label="keyboard.layout"
              icon="hugeicons:keyboard"
            />
          </template>

          <NuxtImg
            loading="lazy"
            :alt="keyboard.name"
            :src="keyboard.cover_image || '/logo-filled.png'"
            class="aspect-[16/9] w-full object-cover rounded-md border border-default bg-muted/30"
          />
        </UPageCard>
      </UPageGrid>

      <UAlert
        v-else
        title="No keyboards yet"
        description="Start by adding the first keyboard for this brand."
        icon="hugeicons:information-circle"
        color="info"
        variant="soft"
      />
    </template>
  </UDashboardPanel>
  <SharedRedirectPage v-else to="/keyboard/brand" />
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()
const brand = computed(() => String(route.params.brand || ''))

const editable = computed(() => userStore.isEditable(brand.value))

const visible = ref({
  createKeyboard: false,
  editBrand: false,
})

const { data, refresh } = await useAsyncData(
  () => `keyboard-brand:${brand.value}`,
  () => $fetch(`/api/keyboards/brands/${brand.value}`),
  {
    watch: [brand],
  },
)

const breadcrumbs = computed(() => {
  return [
    {
      label: 'Keyboard Brands',
      icon: 'hugeicons:keyboard',
      to: '/keyboard/brand',
    },
    {
      label: data.value?.name,
    },
  ]
})

useSeoMeta({
  title: computed(() => data.value?.name || 'Keyboard Brands'),
  description: data.value?.bio,
  ogDescription: data.value?.bio,
  twitterDescription: data.value?.bio,
})
</script>
