<template>
  <UDashboardPanel v-if="maker" :id="`artisan-maker-${route.params.maker}`">
    <template #header>
      <UDashboardNavbar :title="maker.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <SharedOwnerHero
        :title="maker.name"
        :slug="maker.maker_id"
        :invertible="maker.invertible_logo"
        :description="maker.bio"
        :specs="makerSpecs"
        :links="makerLinks"
        details-label="Maker Details"
      >
        <template v-if="authenticated" #actions>
          <UButton
            color="primary"
            icon="hugeicons:dashboard-square-add"
            label="Add Sculpt"
            v-bind="addSculptTarget"
          />

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
              <UButton icon="hugeicons:pin" aria-label="Customize Pins" />
            </UTooltip>

            <template #body="{ close }">
              <ArtisanModalPinSculpt :sculpts="sculpts" @on-success="close" />
            </template>
          </UModal>
        </template>
      </SharedOwnerHero>

      <section class="space-y-4 pt-4">
        <!-- Only long lists get a header, for their filter -->
        <UPageHeader
          v-if="sculpts.length > 12"
          title="Sculpts"
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        >
          <template #links>
            <UInput
              v-model="query"
              icon="hugeicons:search-01"
              placeholder="Filter sculpts"
              aria-label="Filter sculpts"
              class="w-40 sm:w-60"
            />
          </template>
        </UPageHeader>

        <!-- Pinned sculpts first, marked with a pin -->
        <UPageGrid v-if="sortedSculpts.length" :class="artisanGridClass">
          <SharedCatalogCard
            v-for="sculpt in sortedSculpts"
            :key="sculpt.id"
            v-bind="sculptCard(sculpt)"
          >
            <template v-if="isPinned(sculpt)" #badges>
              <UIcon
                name="hugeicons:pin"
                class="absolute top-2 right-2 size-4 text-primary"
                aria-label="Pinned"
              />
            </template>
          </SharedCatalogCard>
        </UPageGrid>

        <UEmpty
          v-else-if="query"
          icon="hugeicons:search-remove"
          title="No Sculpts Match"
          :description="`None of ${maker.name}'s sculpts matches “${query}”.`"
          :actions="[
            {
              label: 'Clear Filter',
              icon: 'hugeicons:cancel-01',
              ui: { label: 'block' },
              onClick: () => (query = ''),
            },
          ]"
        />

        <UEmpty
          v-else
          icon="hugeicons:dashboard-square-add"
          title="No Sculpts Yet"
          description="Know one of their sculpts? Submit it and our staff will review it before it goes public."
          :actions="[
            {
              label: 'Add Sculpt',
              icon: 'hugeicons:add-square',
              ui: { label: 'block' },
              to: {
                path: '/artisan/submissions/submit',
                query: { maker: maker.maker_id },
              },
            },
          ]"
        />
      </section>

      <template v-if="editable">
        <SharedRevisionHistory
          ref="history"
          domain="artisan"
          :parent-key="route.params.maker"
          description="Every change to this maker, newest first. Its sculpts keep their own history."
          @reverted="refresh()"
        />

        <UModal v-model:open="addingSculpt" title="Add Sculpt">
          <template #body>
            <ArtisanModalSculptForm
              :sculpts="sculpts"
              @on-success="
                () => {
                  addingSculpt = false
                  refresh()
                }
              "
            />
          </template>
        </UModal>

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
const { authenticated, favorites } = storeToRefs(userStore)

const editable = computed(() => userStore.isEditable(maker.value?.maker_id))

const {
  target: suggestTarget,
  open: suggestOpen,
  canSuggest,
  suggest,
} = useSuggestEdit(editable)

const editing = ref(false)
const addingSculpt = ref(false)
const query = ref('')
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
const isPinned = (sculpt) => favSculpts.value.includes(sculpt.sculpt_id)
const sortedSculpts = computed(() => {
  const matching = filterByName(sculpts.value, query.value)

  return [
    ...matching.filter(isPinned),
    ...matching.filter((s) => !isPinned(s)),
  ]
})

// Staff add a sculpt in place; everyone else goes to the submission wizard
const addSculptTarget = computed(() =>
  submissionTarget(
    editable.value,
    () => (addingSculpt.value = true),
    'artisan',
    { maker: route.params.maker },
  ),
)

// A sculpt links to its page: the newest colorway's photo, its collection,
// and how many colorways it has
const sculptCard = (sculpt) => ({
  title: sculpt.name,
  description: [
    sculpt.total_colorways && countLabel(sculpt.total_colorways, 'colorway'),
    sculpt.collection,
  ]
    .filter(Boolean)
    .join(' · '),
  img: sculpt.img,
  fallback: '/artisan.png',
  aspect: 'square',
  to: `/artisan/maker/${sculpt.maker_id}/${sculpt.sculpt_id}`,
})

const makerSpecs = computed(() =>
  maker.value?.founded
    ? [
        {
          term: 'Founded',
          icon: 'hugeicons:calendar-03',
          description: maker.value.founded,
        },
      ]
    : [],
)

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
