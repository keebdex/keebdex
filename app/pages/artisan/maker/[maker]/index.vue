<template>
  <UDashboardPanel v-if="maker" :id="`artisan-maker-${route.params.maker}`">
    <template #header>
      <UDashboardNavbar :title="maker.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="editable"
            v-model:visible="visible.edit"
            title="Edit Maker"
          >
            <UButton icon="hugeicons:user-edit-01"> Edit </UButton>

            <template #body="{ close }">
              <ModalMakerForm
                :is-edit="true"
                :metadata="maker"
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
            v-if="Object.hasOwn(favorites, maker.id)"
            v-model:visible="visible.customize_pins"
            title="Customize Pins"
            description="Pin up to 6 sculpts to the top for easy access."
          >
            <UButton icon="hugeicons:pin" color="secondary"> Pins </UButton>

            <template #body="{ close }">
              <ModalPinSculpt
                :sculpts="favoriteSculpts.concat(otherSculpts)"
                @on-success="close"
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
      label: 'Makers',
      icon: 'hugeicons:user-group',
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
</script>
