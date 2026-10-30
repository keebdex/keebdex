<template>
  <UDashboardPanel v-if="maker" :id="`artisan-maker-${route.params.maker}`">
    <template #header>
      <UDashboardNavbar :title="maker.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal v-if="editable" title="Add Sculpt">
            <UButton
              color="primary"
              icon="hugeicons:dashboard-square-add"
              label="Add Sculpt"
            />

            <template #body="{ close }">
              <ArtisanModalSculptForm
                :sculpts="sculpts"
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>

          <SharedRecordActions
            :editable="editable"
            :suggestable="canSuggest(maker)"
            label="Maker"
            @edit="editing = true"
            @suggest="suggest('artisan_maker', maker)"
            @history="history?.show()"
          />

          <UModal
            v-if="Object.hasOwn(favorites, maker.maker_id)"
            title="Customize Pins"
            description="Pin up to 6 sculpts to the top for easy access."
          >
            <UTooltip text="Customize Pins">
              <UButton
                icon="hugeicons:pin"
                color="secondary"
                aria-label="Customize Pins"
              />
            </UTooltip>

            <template #body="{ close }">
              <ArtisanModalPinSculpt
                :sculpts="favoriteSculpts.concat(otherSculpts)"
                @on-success="close"
              />
            </template>
          </UModal>

          <SharedProfileDrawer
            :title="maker.name"
            :slug="maker.maker_id"
            :invertible="maker.invertible_logo"
            :description="maker.bio"
            :links="makerLinks"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <template v-if="editable">
        <SharedRevisionHistory
          ref="history"
          domain="artisan"
          :parent-key="route.params.maker"
          description="Every change to this maker, newest first. Its sculpts keep their own history."
          @reverted="refresh()"
        />

        <UModal v-model:open="editing" title="Edit Maker">
          <template #body>
            <ArtisanModalMakerForm
              :is-edit="true"
              :metadata="maker"
              @on-success="
                () => {
                  editing = false
                  refresh()
                }
              "
            />
          </template>
        </UModal>
      </template>

      <UPageHeader
        v-if="favoriteSculpts.length"
        headline="Pinned"
        :ui="{
          headline: 'text-md',
        }"
      >
        <UPageGrid :class="artisanGridClass">
          <ArtisanSculptCard
            v-for="sculpt in favoriteSculpts"
            :key="sculpt.id"
            :sculpt="sculpt"
          />
        </UPageGrid>
      </UPageHeader>

      <UPageGrid :class="artisanGridClass">
        <ArtisanSculptCard
          v-for="sculpt in otherSculpts"
          :key="sculpt.id"
          :sculpt="sculpt"
        />
      </UPageGrid>

      <SharedSuggestEditModal
        v-if="suggestTarget"
        v-model:open="suggestOpen"
        :entity-type="suggestTarget.entityType"
        :record="suggestTarget.record"
        :form-props="suggestTarget.formProps"
      />
    </template>
  </UDashboardPanel>
  <SharedRedirectPage v-else to="/artisan/maker" />
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()
const { favorites } = storeToRefs(userStore)

const editable = computed(() => userStore.isEditable(maker.value?.maker_id))

const {
  target: suggestTarget,
  open: suggestOpen,
  canSuggest,
  suggest,
} = useSuggestEdit(editable)

const editing = ref(false)
const history = useTemplateRef('history')

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
      icon: 'hugeicons:user-multiple',
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
  titleLogo: logoUrl(maker.value?.maker_id),
})
</script>
