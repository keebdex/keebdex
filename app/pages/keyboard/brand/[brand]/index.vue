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
            <UButton icon="hugeicons:edit-01" label="Edit" />

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

          <SharedProfileDrawer
            :title="data.name"
            :slug="data.slug"
            :description="data.bio"
            :links="brandLinks"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid v-if="data.keyboards?.length">
        <UPageCard
          v-for="keyboard in data.keyboards"
          :key="keyboard.slug"
          :to="`/keyboard/brand/${brand}/${keyboard.slug}`"
          :title="keyboard.name"
          :description="keyboard.description"
          reverse
          spotlight
          :ui="{
            root: 'h-full flex flex-col',
            container: 'h-full grid grid-rows-[auto_minmax(0,1fr)]',
            description: 'line-clamp-3',
          }"
        >
          <NuxtImg
            loading="lazy"
            :alt="keyboard.name"
            :src="keyboard.cover_image || '/keyboard.png'"
            class="aspect-video w-full object-cover"
          />
        </UPageCard>
      </UPageGrid>

      <SharedContributeSection
        v-else
        icon="hugeicons:keyboard"
        title="No Keyboards Yet"
        description="Please check back later or contribute by adding keyboards from this brand."
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
      label: 'Brands',
      icon: 'hugeicons:user-group-03',
      to: '/keyboard/brand',
    },
    {
      label: data.value?.name,
    },
  ]
})

const description = computed(() => {
  if (data.value?.bio) {
    return data.value.bio
  }

  return `Explore keyboards from ${data.value?.name} and discover their unique features, designs, and innovations in the world of mechanical keyboards.`
})

const brandLinks = computed(() => {
  const items = []

  if (data.value?.website) {
    items.push({
      label: 'Website',
      icon: 'hugeicons:globe-02',
      to: data.value.website,
      target: '_blank',
    })
  }

  if (data.value?.instagram) {
    items.push({
      label: 'Instagram',
      icon: 'hugeicons:instagram',
      to: data.value.instagram,
      target: '_blank',
    })
  }

  if (data.value?.discord) {
    items.push({
      label: 'Discord',
      icon: 'hugeicons:discord',
      to: data.value.discord,
      target: '_blank',
    })
  }

  return items
})

useSeoMeta({
  title: computed(() => data.value?.name || 'Keyboard Brands'),
  description: description.value,
  ogDescription: description.value,
  twitterDescription: description.value,
})

defineOgImage('Module', {
  title: data.value?.name,
  description: description.value,
  titleLogo: `/logo/${data.value?.slug}.png`,
})
</script>
