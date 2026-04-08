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
            v-model:visible="visible.create"
            title="Add Sculpt"
          >
            <UButton
              color="primary"
              icon="hugeicons:dashboard-square-add"
              label="Add Sculpt"
            />

            <template #body="{ close }">
              <ArtisanModalSculptForm
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
            <UButton icon="hugeicons:pin" color="secondary" label="Pins" />

            <template #body="{ close }">
              <ArtisanModalPinSculpt
                :sculpts="favoriteSculpts.concat(otherSculpts)"
                @on-success="close"
              />
            </template>
          </UModal>

          <UModal
            v-if="editable"
            v-model:visible="visible.edit"
            title="Edit Maker"
          >
            <UButton icon="hugeicons:edit-01" label="Edit" />

            <template #body="{ close }">
              <ArtisanModalMakerForm
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

          <SharedProfileDrawer
            :title="maker.name"
            :slug="maker.id"
            :description="maker.bio"
            :links="makerLinks"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHeader
        v-if="favoriteSculpts.length"
        headline="Pinned"
        :ui="{
          headline: 'text-md',
        }"
      >
        <UPageGrid>
          <ArtisanSculptCard
            v-for="sculpt in favoriteSculpts"
            :key="sculpt.id"
            :sculpt="sculpt"
          />
        </UPageGrid>
      </UPageHeader>

      <UPageGrid>
        <ArtisanSculptCard
          v-for="sculpt in otherSculpts"
          :key="sculpt.id"
          :sculpt="sculpt"
        />
      </UPageGrid>
    </template>
  </UDashboardPanel>
  <SharedRedirectPage v-else to="/artisan/maker" />
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()
const { favorites } = storeToRefs(userStore)

const editable = computed(() => userStore.isEditable(maker.value?.id))

const visible = ref({
  create: false,
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

const sculpts = computed(() => Object.values(maker.value?.sculpts || {}))
const favSculpts = computed(() => favorites.value[route.params.maker] || [])
const favoriteSculpts = computed(() => {
  return sculpts.value.filter((s) => favSculpts.value.includes(s.sculpt_id))
})
const otherSculpts = computed(() => {
  return sculpts.value.filter((s) => !favSculpts.value.includes(s.sculpt_id))
})

const makerLinks = computed(() => {
  const items = []

  if (maker.value?.website) {
    items.push({
      label: 'Website',
      icon: 'hugeicons:globe-02',
      to: maker.value.website,
      target: '_blank',
    })
  }

  if (maker.value?.instagram) {
    items.push({
      label: 'Instagram',
      icon: 'hugeicons:instagram',
      to: maker.value.instagram,
      target: '_blank',
    })
  }

  if (maker.value?.discord) {
    items.push({
      label: 'Discord',
      icon: 'hugeicons:discord',
      to: maker.value.discord,
      target: '_blank',
    })
  }

  if (maker.value?.artisancollector) {
    items.push({
      label: 'ArtisanCollector',
      icon: 'hugeicons:globe-02',
      to: maker.value.artisancollector,
      target: '_blank',
    })
  }

  if (
    !maker.value?.disable_google_sync &&
    Array.isArray(maker.value?.document_ids) &&
    maker.value.document_ids.length
  ) {
    maker.value.document_ids.forEach((docId, idx) => {
      items.push({
        label:
          maker.value.document_ids.length > 1
            ? `Catalogue ${idx + 1}`
            : 'Catalogue',
        icon: 'hugeicons:file-02',
        to: `https://docs.google.com/document/d/${docId}`,
        target: '_blank',
      })
    })
  }

  return items
})

const breadcrumbs = computed(() => {
  return [
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

defineOgImage('Module', {
  title: maker.value?.name,
  description: maker.value?.bio,
  titleLogo: `/logo/${maker.value?.id}.png`,
})
</script>
