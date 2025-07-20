<template>
  <UDashboardPanel
    v-if="maker"
    :id="`artisan-maker-${route.params.maker}`"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <UDashboardNavbar :title="maker.name">
        <template #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="editable"
            v-model:visible="visible.edit"
            title="Edit Maker"
          >
            <UButton icon="hugeicons:user-edit-01"> Edit </UButton>

            <template #body>
              <ModalMakerForm
                :is-edit="true"
                :metadata="maker"
                @on-success="toggleEditMaker"
              />
            </template>
          </UModal>

          <UModal
            v-if="Object.hasOwn(favorites, maker.id)"
            v-model:visible="visible.customize_pins"
            title="Customize Pins"
            description="Pin up to 6 sculpts to the top for easy access."
          >
            <UButton icon="hugeicons:pin" color="secondary"> Pins </UButton>

            <template #body>
              <ModalPinSculpt
                :sculpts="favoriteSculpts.concat(otherSculpts)"
                @on-success="toggleCustomizePins"
              />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <MakerPageHeader :maker="maker" :sculpts="favoriteSculpts" />

      <UPageGrid>
        <SculptCard
          v-for="sculpt in otherSculpts"
          :key="sculpt.id"
          :sculpt="sculpt"
        />
      </UPageGrid>
    </template>
  </UDashboardPanel>
  <BackToArtisanMakers v-else />
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()
const { favorites } = storeToRefs(userStore)

const editable = computed(() => userStore.isEditable(maker.id))

const visible = ref({
  edit: false,
  customize_pins: false,
})

const { data: maker, refresh } = await useAsyncData(
  `maker:${route.params.maker}`,
  () => $fetch(`/api/makers/${route.params.maker}`),
  {
    watch: [() => route.params.maker],
  },
)

const sculpts = Object.values(maker.value.sculpts)
const favSculpts = computed(() => favorites.value[route.params.maker] || [])
const favoriteSculpts = computed(() => {
  return sculpts.filter((s) => favSculpts.value.includes(s.sculpt_id))
})
const otherSculpts = computed(() => {
  return sculpts.filter((s) => !favSculpts.value.includes(s.sculpt_id))
})

const breadcrumbs = computed(() => {
  return [
    {
      icon: 'hugeicons:home-01',
      to: '/',
    },
    {
      label: 'Makers',
      icon: 'hugeicons:user-group-03',
      to: '/artisan/maker',
    },
    {
      label: maker.value.name,
    },
  ]
})

useSeoMeta({
  title: maker.value?.name,
  description: maker.value?.bio,
  ogDescription: maker.value?.bio,
  twitterDescription: maker.value?.bio,
})

defineOgImageComponent('Artisan', {
  makerId: maker.value?.id,
  invertible: maker.value?.invertible_logo,
})

const toggleEditMaker = (shouldRefresh) => {
  visible.value.edit = !visible.value.edit
  if (shouldRefresh) {
    refresh()
  }
}

const toggleCustomizePins = () => {
  visible.value.customize_pins = !visible.value.customize_pins
}
</script>
