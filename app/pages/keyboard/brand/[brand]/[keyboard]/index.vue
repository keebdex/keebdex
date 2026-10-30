<template>
  <UDashboardPanel v-if="data" :id="`keyboard-${slug}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHeader
        :title="title"
        :ui="{
          root: 'pt-0 pb-6',
          wrapper: 'gap-4 sm:flex-row sm:items-start sm:justify-between',
          links: 'flex flex-wrap gap-2 shrink-0',
          title: 'text-2xl',
          headline: 'mb-1',
        }"
      >
        <template #title>
          <span class="flex items-center gap-3">
            <UAvatar
              :src="logoUrl(data.brand?.slug)"
              :alt="data.brand?.name"
              size="lg"
              :ui="{
                root: 'bg-transparent rounded-none shrink-0',
                image: data.brand?.invertible_logo
                  ? 'rounded-none dark:invert'
                  : 'rounded-none',
              }"
            />
            {{ title }}
          </span>
        </template>

        <template v-if="data.original" #headline>
          <span class="text-sm text-muted font-normal">
            Based on
            <ULink
              :to="`/keyboard/brand/${data.derived_from}`"
              class="font-medium text-highlighted hover:underline"
            >
              {{ originalName }}
            </ULink>
          </span>
        </template>

        <!-- The page's actions sit with the keyboard they act on: Add keeps
             its label, the rest are icon-only -->
        <template v-if="authenticated || data.derived_keyboards?.length" #links>
          <UButton
            v-if="authenticated"
            color="primary"
            icon="hugeicons:delivery-view-01"
            label="Add Release"
            v-bind="addReleaseTarget"
          />

          <SharedRecordActions
            :editable="editable"
            :suggestable="canSuggest(data)"
            :deletable="false"
            :ghost="false"
            label="Keyboard"
            @edit="keyboardFormOpen = true"
            @suggest="suggest('keyboard', data)"
            @history="history?.show()"
          />

          <!-- Ordering needs at least two releases. -->
          <UTooltip
            v-if="editable && (data.releases?.length || 0) > 1"
            text="Sort Releases"
          >
            <UButton
              :icon="appConfig.ui.icons.sortManual"
              aria-label="Sort Releases"
              @click="sortOpen = true"
            />
          </UTooltip>

          <KeyboardRelatedKeyboardsDrawer
            v-if="data.derived_keyboards?.length"
            :keyboards="data.derived_keyboards"
            title="Derived Designs"
            description="A collection of keyboards that share this design's DNA through community reworks, official collaborations, and specialized iterations."
            :button-label="`${data.derived_keyboards.length} Derived`"
            icon="hugeicons:archive-02"
          />
        </template>

        <template #description>
          <div class="flex flex-col gap-4">
            <SharedDescription
              v-if="data.description"
              :description="data.description"
              class="text-sm max-w-prose"
            />

            <!-- The keyboard's own specs, shared by every release -->
            <SharedSpecList :items="keyboardSpecs" />
          </div>
        </template>
      </UPageHeader>

      <UPageList v-if="releases.length" divide>
        <section
          v-for="release in releases"
          :key="release.id"
          class="space-y-4 py-6 first:pt-0"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base md:text-lg font-semibold text-highlighted">
                  {{ release.name }}
                </h2>
                <UBadge
                  v-if="release.release_year"
                  :label="String(release.release_year)"
                  icon="hugeicons:calendar-03"
                />
              </div>
              <p v-if="release.description" class="text-sm text-muted">
                {{ release.description }}
              </p>
            </div>

            <!-- Icon-only, like the variant cards, so they read as the
                 release's and not the keyboard's actions -->
            <SharedRecordActions
              :editable="editable"
              :suggestable="canSuggest(release)"
              :deletable="!release.variants?.length"
              label="Release"
              class="shrink-0"
              @edit="openReleaseForm(release)"
              @suggest="
                suggest('keyboard_release', release, { keyboard: data })
              "
              @history="
                showHistory('keyboard_release', release.id, release.name)
              "
              @delete="
                openDelete(
                  'Release',
                  release.name,
                  `/api/keyboards/${release.brand_keyboard_slug}/releases/${release.id}`,
                )
              "
            />
          </div>

          <!-- Laid out like the keyboard's specs in the header -->
          <SharedSpecList
            v-if="release.specs.length"
            :items="release.specs"
            layout="grid"
          />

          <UEmpty
            v-if="!release.variants.length"
            icon="hugeicons:layers-01"
            title="No Variants Yet"
            :description="
              authenticated
                ? 'Add the colorways and finishes this release came in.'
                : 'The colorways and finishes of this release have not been added yet.'
            "
            :actions="addVariantActions(release)"
          />

          <UPageGrid v-else>
            <UModal
              v-for="variant in release.variants"
              :key="variant.id"
              :ui="{
                content: 'sm:max-w-3xl',
              }"
            >
              <SharedCatalogCard
                :title="variant.variant_name"
                :description="variant.finish_type"
                :price="variant.price"
                :img="variant.img_front || variant.img_back"
                fallback="/keyboard.png"
                :editable="editable"
                :suggestable="canSuggest(variant)"
                class="cursor-pointer"
                @edit="openVariantForm(variant, release)"
                @suggest="
                  suggest('keyboard_variant', variant, { keyboard: data })
                "
                @history="
                  showHistory(
                    'keyboard_variant',
                    variant.id,
                    variant.variant_name,
                  )
                "
                @delete="
                  openDelete(
                    'Variant',
                    variant.variant_name,
                    `/api/keyboards/${variant.brand_keyboard_slug}/variants/${variant.id}`,
                  )
                "
              >
                <template #badges>
                  <UBadge
                    v-if="variant.customSpecs"
                    label="Custom Specs"
                    icon="hugeicons:settings-02"
                    class="absolute top-2 left-2"
                  />
                </template>

                <template v-if="authenticated" #footer-start>
                  <SharedSaveToCollection
                    :item="variant.saveItem"
                    :item-name="variant.variant_name"
                    category="keyboard"
                    label="Save"
                    keep-label
                    @on-select="saveToCollection"
                  />
                </template>
              </SharedCatalogCard>

              <template #content>
                <KeyboardVariantCard
                  :keyboard="data"
                  :release="release"
                  :variant="variant"
                  :authenticated="authenticated"
                  @save-to="saveToCollection"
                />
              </template>
            </UModal>

            <UButton
              v-if="authenticated"
              label="Add Variant"
              icon="hugeicons:add-square"
              variant="outline"
              class="w-full min-h-24 justify-center ring-0 border border-default border-dashed rounded-lg"
              v-bind="addVariantTarget(release)"
            />
          </UPageGrid>
        </section>
      </UPageList>

      <UEmpty
        v-else
        icon="hugeicons:package"
        title="Nothing Has Shipped Yet"
        description="Know a release of this keyboard? Submit it and our staff will review it before it goes public."
      />

      <template v-if="editable">
        <SharedRevisionHistory
          ref="history"
          :button="false"
          domain="keyboard"
          :parent-key="slug"
          description="Every change to this keyboard, its releases, and variants, newest first."
          @reverted="onReverted"
        />

        <UModal v-model:open="keyboardFormOpen" title="Edit Keyboard">
          <template #body>
            <KeyboardModalKeyboardForm
              :is-edit="true"
              :metadata="data"
              @on-success="onKeyboardSaved"
            />
          </template>
        </UModal>

        <UModal
          v-model:open="releaseForm.open"
          :title="releaseForm.isEdit ? 'Edit Release' : 'Add Release'"
        >
          <template #body>
            <KeyboardModalReleaseForm
              :is-edit="releaseForm.isEdit"
              :metadata="releaseForm.metadata"
              :keyboard="data"
              @on-success="onFormSuccess(releaseForm)"
            />
          </template>
        </UModal>

        <UModal
          v-model:open="variantForm.open"
          :title="variantForm.isEdit ? 'Edit Variant' : 'Add Variant'"
        >
          <template #body>
            <KeyboardModalVariantForm
              :is-edit="variantForm.isEdit"
              :metadata="variantForm.metadata"
              :keyboard="data"
              @on-success="onFormSuccess(variantForm)"
            />
          </template>
        </UModal>

        <UModal v-model:open="sortOpen" title="Sort Releases">
          <template #body>
            <KeyboardModalReleaseSortForm
              :keyboard="data"
              @on-success="onSorted"
            />
          </template>
        </UModal>

        <SharedConfirmModal
          v-model:open="deleteTarget.open"
          :title="`Delete ${deleteTarget.entity}`"
          :description="`Are you sure you want to delete ${deleteTarget.entity.toLowerCase()} '${deleteTarget.name}'? This action cannot be undone.`"
          :loading="deleting"
          @confirm="confirmDelete"
        />
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
  <SharedRedirectPage v-else :to="`/keyboard/brand/${route.params.brand}`" />
</template>

<script setup>
import { sortBy } from 'es-toolkit/compat'

const route = useRoute()
const userStore = useUserStore()
const { authenticated } = storeToRefs(userStore)
const appConfig = useAppConfig()

const history = useTemplateRef('history')

// History of one release or variant, from its own menu.
const showHistory = (entityType, entityId, label) => {
  history.value?.show({ record: { entityType, entityId, label } })
}

const slug = computed(() => `${route.params.brand}/${route.params.keyboard}`)

const editable = computed(() => userStore.isEditable(route.params.brand))

const {
  target: suggestTarget,
  open: suggestOpen,
  canSuggest,
  suggest,
} = useSuggestEdit(editable)

const { data, refresh } = await useAsyncData(
  () => `keyboard:${slug.value}`,
  () => $fetch(`/api/keyboards/${slug.value}`),
  {
    watch: [slug],
  },
)

// Reverting a rename moves the page back to its old address.
const onReverted = ({ entityType, changes }) => {
  if (entityType === 'keyboard' && changes.slug) {
    return navigateTo(`/keyboard/brand/${route.params.brand}/${changes.slug}`)
  }

  refresh()
}

const title = computed(() =>
  formatKeyboardDescription([data.value?.brand?.name, data.value?.name]),
)

const originalName = computed(() =>
  formatKeyboardDescription([
    data.value?.original?.brand?.name,
    data.value?.original?.name,
  ]),
)

// The keyboard's own specs, shared by every release and variant.
const keyboardSpecs = computed(() => keyboardSpecItems(data.value || {}))

// Submitters and staff can read releases/variants still under review, but the
// keyboard page only lists approved ones; the rest live in the review queue.
// Newest release first, with what the template shows worked out once.
const releases = computed(() =>
  sortBy(
    (data.value?.releases || []).filter(isApproved).map((release) => ({
      ...release,
      // A release with specs per variant leaves materials to each variant;
      // prices show on the variant cards.
      specs: release.variant_specs
        ? []
        : KEYBOARD_MATERIAL_SPECS.map(({ term, field, icon }) => ({
            term,
            description: joinSpecList(release[field]),
            icon,
          })).filter((spec) => spec.description),
      variants: (release.variants || []).filter(isApproved).map((variant) => ({
        ...variant,
        price: variantPrice(variant, release),
        customSpecs: hasCustomSpecs(variant, release),
        saveItem: { ...variant, release_name: release.name },
      })),
    })),
    'order',
  ).reverse(),
)

// Staff add a variant in place; other signed-in users submit one.
// Staff add a release in place; others submit one for review
const addReleaseTarget = computed(() =>
  editable.value
    ? { onClick: () => openReleaseForm() }
    : {
        to: {
          path: '/keyboard/submissions/submit',
          query: { brand: route.params.brand, keyboard: slug.value },
        },
      },
)

const addVariantTarget = (release) =>
  editable.value
    ? { onClick: () => openVariantForm({ release_id: release.id }) }
    : {
        to: {
          path: '/keyboard/submissions/submit',
          query: {
            brand: route.params.brand,
            keyboard: slug.value,
            release: release.id,
          },
        },
      }

const addVariantActions = (release) =>
  authenticated.value
    ? [
        {
          label: 'Add Variant',
          icon: 'hugeicons:add-square',
          ui: { label: 'block' },
          ...addVariantTarget(release),
        },
      ]
    : []

const breadcrumbs = computed(() => {
  return [
    {
      label: 'Brands',
      to: '/keyboard/brand',
      icon: 'hugeicons:user-multiple',
    },
    {
      label: data.value?.brand?.name,
      to: `/keyboard/brand/${route.params.brand}`,
      avatar: {
        src: logoUrl(route.params.brand),
        alt: data.value?.brand?.name,
        ui: {
          root: 'bg-transparent',
          image: data.value?.brand?.invertible_logo
            ? 'rounded-none dark:invert'
            : 'rounded-none',
        },
      },
    },
    {
      label: data.value?.name,
    },
  ]
})

// Staff forms and the delete confirmation, one of each for the whole page.
const keyboardFormOpen = ref(false)
const releaseForm = reactive({ open: false, isEdit: false, metadata: {} })
const variantForm = reactive({ open: false, isEdit: false, metadata: {} })

const openReleaseForm = (release) => {
  Object.assign(releaseForm, {
    open: true,
    isEdit: !!release,
    metadata: { ...release },
  })
}

const openVariantForm = (variant, release) => {
  Object.assign(variantForm, {
    open: true,
    isEdit: !!release,
    metadata: release
      ? { ...variant, release_name: release.name }
      : { ...variant },
  })
}

const onKeyboardSaved = () => {
  keyboardFormOpen.value = false
  refresh()
}

const onFormSuccess = (form) => {
  form.open = false
  refresh()
}

const {
  target: deleteTarget,
  deleting,
  open: openDelete,
  confirm: confirmDelete,
} = useConfirmDelete(refresh)

const sortOpen = ref(false)

const onSorted = () => {
  sortOpen.value = false
  refresh()
}

const { addItem } = useCollectionItem()

const saveToCollection = (collection, variant) => {
  const contextName = formatKeyboardDescription([
    data.value?.name,
    variant.release_name,
    variant.variant_name,
  ])
  addItem(collection, { keyboard_item_id: variant.id }, contextName, 'Keyboard')
}

const description = computed(() => {
  if (data.value?.description) {
    return data.value.description
  }

  return `Explore ${data.value?.name} from ${data.value?.brand?.name} and discover its unique features, designs, and innovations in the world of mechanical keyboards.`
})

useSeoMeta({
  title: title.value,
  description: description.value,
  ogDescription: description.value,
  twitterDescription: description.value,
})

defineOgImage('Module', {
  title: data.value?.name,
  description: description.value,
  headline: data.value?.brand?.name,
  headlineLogo: logoUrl(data.value?.brand?.slug),
})
</script>
