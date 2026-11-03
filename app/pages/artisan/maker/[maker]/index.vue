<template>
  <UDashboardPanel v-if="maker" :id="`artisan-maker-${route.params.maker}`">
    <template #header>
      <UDashboardNavbar :title="breadcrumbs.at(-1).label">
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
            v-if="Object.hasOwn(pinnedMakers, maker.maker_id)"
            title="Customize Pins"
            description="Pin sculpts to keep them at the top of the list."
          >
            <UTooltip text="Customize Pins">
              <UButton icon="hugeicons:pin" aria-label="Customize Pins" />
            </UTooltip>

            <template #body="{ close }">
              <SharedPinForm
                :items="sculptList.all"
                value-key="sculpt_id"
                :selected="sculptList.pinned.map((sculpt) => sculpt.sculpt_id)"
                :save="
                  (ids) =>
                    userStore.savePinnedChildren(
                      'artisan',
                      route.params.maker,
                      ids,
                    )
                "
                @on-success="close"
              />
            </template>
          </UModal>
        </template>
      </SharedOwnerHero>

      <!-- Pinned sculpts get a group of their own above the rest; without
           pins the grid follows the hero directly -->
      <section
        v-for="(group, index) in sculptList.groups"
        :key="group.label"
        :class="['space-y-3', index ? 'pt-8' : 'pt-4']"
      >
        <SharedPinGroupLabel
          v-if="sculptList.pinned.length"
          :pinned="group.pinned"
        >
          {{ group.label }}
        </SharedPinGroupLabel>

        <UPageGrid :class="artisanGridClass">
          <SharedCatalogCard
            v-for="sculpt in group.items"
            :key="sculpt.id"
            v-bind="sculptCard(sculpt)"
          />
        </UPageGrid>
      </section>

      <section v-if="!sculpts.length" class="pt-4">
        <UEmpty
          icon="hugeicons:dashboard-square-add"
          title="No Sculpts Yet"
          description="Know one of their sculpts? Submit it and our staff will review it before it goes public."
          :actions="[
            {
              label: 'Add Sculpt',
              icon: 'hugeicons:add-square',
              ui: { label: 'block' },
              ...addSculptTarget,
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
const { authenticated, pinnedMakers } = storeToRefs(userStore)

const editable = computed(() => userStore.isEditable(maker.value?.maker_id))

const {
  target: suggestTarget,
  open: suggestOpen,
  canSuggest,
  suggest,
} = useSuggestEdit(editable)

const editing = ref(false)
const addingSculpt = ref(false)
const history = useTemplateRef('history')

const { data: maker, refresh, error } = await useAsyncData(
  `maker:${route.params.maker}`,
  () => $fetch(`/api/makers/${route.params.maker}`),
  {
    watch: [() => route.params.maker],
  },
)

throwIfNotFound(error.value)

const sculpts = computed(() => Object.values(maker.value?.sculpts || {}))
const favSculpts = computed(() => pinnedMakers.value[route.params.maker] || [])
const isPinned = (sculpt) => favSculpts.value.includes(sculpt.sculpt_id)
const sculptList = computed(() => splitPinned(sculpts.value, isPinned))

// Staff add a sculpt in place; everyone else goes to the submission wizard
const addSculptTarget = computed(() =>
  submissionTarget(
    editable.value,
    () => (addingSculpt.value = true),
    'artisan',
    { maker: route.params.maker },
  ),
)

// A sculpt links to its page: the newest colorway's photo and its collection
const sculptCard = (sculpt) => ({
  title: sculpt.name,
  description: sculpt.collection,
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
  const items = ownerLinks(maker.value)

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

// The trail ends at the parent page (shown, not marked current): the page
// header names this one
const breadcrumbs = computed(() => {
  return [
    {
      label: 'Makers',
      icon: 'hugeicons:user-multiple',
      to: '/artisan/maker',
      active: false,
    },
  ]
})

const description = computed(
  () =>
    maker.value?.bio ||
    `Artisan keycap sculpts and colorways by ${maker.value?.name}.`,
)

useSeoMeta({
  title: () => maker.value?.name,
  description,
})

defineOgImage('Module', {
  title: maker.value?.name,
  description: description.value,
  titleLogo: logoUrl(maker.value?.maker_id),
})
</script>
