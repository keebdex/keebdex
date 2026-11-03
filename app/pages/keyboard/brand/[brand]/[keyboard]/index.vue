<template>
  <UDashboardPanel v-if="data" :id="`keyboard-${slug}`">
    <template #header>
      <UDashboardNavbar :title="breadcrumbs.at(-1).label">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- The variant photos as a carousel with a filmstrip, beside the
           keyboard's name, story, and design -->
      <SharedDetailHero>
        <template #media>
          <div class="space-y-3">
            <!-- Every variant with a photo, one slide each, with its name,
               release, and price; clicking a slide opens the variant -->
            <UCarousel
              v-if="photos.length"
              ref="photoCarousel"
              v-slot="{ item, index }"
              :items="photos"
              loop
              :arrows="photos.length > 1"
              @select="activePhoto = $event"
            >
              <figure
                class="group relative overflow-hidden rounded-lg border border-default bg-elevated"
              >
                <button
                  type="button"
                  class="absolute inset-0 z-1"
                  :aria-label="`Open ${item.variant.variant_name}`"
                  @click="openVariant(item.variant, item.release)"
                />
                <!-- Only the slides near the current one (and those already
                   seen) render their photo, so the server builds one or
                   three images instead of every variant's; the first slide
                   is above the fold -->
                <NuxtImg
                  v-if="slideShown(index)"
                  :src="item.variant.img"
                  :alt="variantTitle(data, item.release, item.variant)"
                  sizes="xs:96vw lg:48vw 2xl:44vw"
                  :loading="index ? 'lazy' : 'eager'"
                  :fetchpriority="index ? undefined : 'high'"
                  decoding="async"
                  class="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div v-else class="aspect-video w-full" />
                <figcaption
                  class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-black/70 to-transparent p-4 pt-12 text-white"
                >
                  <span class="min-w-0">
                    <span class="block truncate font-semibold">
                      {{ item.variant.variant_name }}
                    </span>
                    <span class="block truncate text-xs text-white/75">
                      {{ item.release.name }}
                    </span>
                  </span>
                  <span
                    v-if="item.variant.price"
                    class="shrink-0 text-sm font-medium tabular-nums"
                  >
                    {{ item.variant.price }}
                  </span>
                </figcaption>
              </figure>
            </UCarousel>

            <!-- No photo yet: the placeholder, with nothing to open -->
            <NuxtImg
              v-else
              src="/keyboard.png"
              :alt="title"
              class="aspect-video w-full rounded-lg border border-default bg-elevated object-cover"
            />

            <!-- The slides as thumbnails, following the carousel both ways -->
            <div
              v-if="photos.length > 1"
              ref="filmstrip"
              class="flex gap-2 overflow-x-auto pb-1"
              role="listbox"
              aria-label="Variants"
            >
              <button
                v-for="(row, index) in photos"
                :key="row.variant.id"
                type="button"
                role="option"
                :aria-selected="index === activePhoto"
                :aria-label="row.variant.variant_name"
                class="shrink-0 overflow-hidden rounded-md border-2 transition-opacity"
                :class="
                  index === activePhoto
                    ? 'border-primary'
                    : 'border-transparent opacity-60 hover:opacity-100'
                "
                @click="photoCarousel?.emblaApi?.scrollTo(index)"
              >
                <NuxtImg
                  :src="row.variant.img"
                  :alt="row.variant.variant_name"
                  sizes="80px"
                  loading="lazy"
                  decoding="async"
                  class="aspect-video w-20 object-cover"
                />
              </button>
            </div>
          </div>
        </template>

        <!-- The keyboard and its actions -->
        <UPageHeader :ui="detailPageHeaderUi(true)">
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

          <template v-if="authenticated" #links>
            <UButton
              color="primary"
              icon="hugeicons:delivery-view-01"
              label="Add Release"
              v-bind="addReleaseTarget"
            />

            <SharedRecordActions
              :editable="editable"
              :suggestable="canSuggest(data)"
              label="Keyboard"
              @edit="editing = true"
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
          </template>

          <template v-if="data.description" #description>
            <SharedDescription :description="data.description" />
          </template>
        </UPageHeader>

        <!-- The design every release shares, one row each, in as many
               columns as the column's width allows -->
        <SharedSpecList :items="keyboardSpecs" layout="rows" />
      </SharedDetailHero>

      <!-- The keyboards built on this design, right under it so many
           releases don't bury them, in the same grid as other keyboard
           cards. The original of a derived keyboard is its Based on link in
           the header. -->
      <section v-if="data.derived_keyboards?.length" class="space-y-4 pt-4">
        <UPageHeader
          title="Derived Designs"
          description="Community reworks, official collaborations, and iterations that share this design's DNA."
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        />

        <UPageGrid>
          <UPageCard
            v-for="keyboard in data.derived_keyboards"
            :key="keyboard.brand_keyboard_slug"
            :to="`/keyboard/brand/${keyboard.brand_keyboard_slug}`"
            :title="formatKeyboardDescription([keyboard.brand?.name, keyboard.name])"
            reverse
            spotlight
            :ui="{
              root: 'h-full flex flex-col',
              container: imageCardContainerClass,
            }"
          >
            <NuxtImg
              preset="cover"
              loading="lazy"
              decoding="async"
              :alt="keyboard.name"
              :src="keyboard.cover_image || '/keyboard.png'"
              class="aspect-video w-full rounded object-cover"
            />
          </UPageCard>
        </UPageGrid>
      </section>

      <template v-if="releases.length">
        <!-- Every release as a UTimeline item, in the release order staff
             set (newest first): its name and actions as the title, then its
             story, specs, and variants as cards, on a primary rail -->
        <section class="space-y-6 pt-4">
          <UPageHeader
            title="Production History"
            :as="detailSectionHeaderAs"
            :ui="detailSectionHeaderUi"
          />

          <UTimeline
            :items="timelineItems"
            size="sm"
            :ui="{
              item: 'gap-4',
              indicator: 'bg-primary text-inverted',
              separator: 'bg-primary',
              wrapper: 'min-w-0 flex-1 pb-10 group-last:pb-0',
              title: 'text-lg font-semibold',
              // The page's text size for the cards; app.config already
              // gives timeline bodies the page's color
              description: 'space-y-4 text-base',
            }"
          >
            <template #title="{ item: { release } }">
              <div class="flex items-start justify-between gap-2">
                <h3 class="min-w-0 leading-tight wrap-break-word">
                  {{ release.name }}
                </h3>

                <!-- Ghost, so they read as the release's and not the
                     keyboard's actions -->
                <div class="flex shrink-0 items-center gap-1">
                  <UTooltip v-if="authenticated" text="Add Variant">
                    <UButton
                      icon="hugeicons:add-square"
                      variant="ghost"
                      aria-label="Add Variant"
                      v-bind="addVariantTarget(release)"
                    />
                  </UTooltip>

                  <SharedRecordActions
                    ghost
                    :editable="editable"
                    :suggestable="canSuggest(release)"
                    :deletable="!release.variants?.length"
                    label="Release"
                    @edit="openReleaseForm(release)"
                    @suggest="
                      suggest('keyboard_release', release, { keyboard: data })
                    "
                    @history="
                      showHistory('keyboard_release', release.id, release.name)
                    "
                    @delete="deleteRelease(release)"
                  />
                </div>
              </div>
            </template>

            <template #description="{ item: { release } }">
              <SharedDescription
                v-if="release.description"
                :description="release.description"
                class="line-clamp-3 text-sm text-muted"
              />

              <SharedSpecList
                v-if="release.specs.length"
                :items="release.specs"
              />

              <!-- The release's variants as cards, opening the drawer -->
              <UPageGrid
                v-if="release.variants.length"
                class="lg:grid-cols-2 xl:grid-cols-3"
              >
                <SharedCatalogCard
                  v-for="variant in release.variants"
                  :key="variant.id"
                  :title="variant.variant_name"
                  :description="variant.finish_type"
                  :price="variant.price"
                  :img="variant.img"
                  fallback="/keyboard.png"
                  :editable="editable"
                  :suggestable="canSuggest(variant)"
                  class="cursor-pointer"
                  @click="openVariant(variant, release)"
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
                  @delete="deleteVariant(variant)"
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
                      @on-select="saveToCollection"
                    />
                  </template>
                </SharedCatalogCard>
              </UPageGrid>

              <p v-else class="text-sm text-dimmed">
                No variants recorded yet.
              </p>
            </template>
          </UTimeline>
        </section>
      </template>

      <UEmpty
        v-else
        icon="hugeicons:package"
        title="Nothing Has Shipped Yet"
        description="Know a release of this keyboard? Submit it and our staff will review it before it goes public."
        class="mt-4"
      />

      <KeyboardVariantDrawer
        v-model:open="variantDrawer.open"
        :keyboard="data"
        :release="variantDrawer.release"
        :variant="variantDrawer.variant"
        :authenticated="authenticated"
        @save-to="saveToCollection"
      />

      <template v-if="editable">
        <SharedRevisionHistory
          ref="history"
          domain="keyboard"
          :parent-key="slug"
          description="Every change to this keyboard, its releases, and variants, newest first."
          @reverted="onReverted"
        />

        <UModal v-model:open="editing" title="Edit Keyboard">
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

const { data, refresh, error } = await useAsyncData(
  () => `keyboard:${slug.value}`,
  () => $fetch(`/api/keyboards/${slug.value}`),
  {
    watch: [slug],
  },
)

throwIfNotFound(error.value)

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
      specs: releaseSpecItems(release, data.value),
      variants: (release.variants || []).filter(isApproved).map((variant) => {
        const { price, custom } = resolveVariantSpecs(variant, release)

        return {
          ...variant,
          // Front photo, else back; prices show on the variant cards
          img: variant.img_front || variant.img_back,
          price,
          customSpecs: custom,
          saveItem: { ...variant, release_name: release.name },
        }
      }),
    })),
    'order',
  ).reverse(),
)

// The releases as timeline items, with the release itself for the slots
const timelineItems = computed(() =>
  releases.value.map((release) => ({
    icon: 'hugeicons:delivery-view-01',
    release,
  })),
)

// The carousel's slides: every variant with a photo, newest release first
const photos = computed(() =>
  releases.value.flatMap((release) =>
    release.variants
      .filter((variant) => variant.img)
      .map((variant) => ({ variant, release })),
  ),
)

const photoCarousel = useTemplateRef('photoCarousel')
const filmstrip = useTemplateRef('filmstrip')
const activePhoto = ref(0)

// The current slide and its neighbours (the carousel loops) render their
// photo, and slides that have done so keep it
const seenSlides = reactive(new Set())

const isNeighbour = (index, current) => {
  const count = photos.value.length
  const offset = (index - current + count) % count

  return offset <= 1 || offset === count - 1
}

const slideShown = (index) =>
  isNeighbour(index, activePhoto.value) || seenSlides.has(index)

// Keep the current slide's thumbnail in view as the carousel moves, and keep
// the photos it brought in
watch(activePhoto, (current, previous) => {
  photos.value.forEach((_, index) => {
    if (isNeighbour(index, previous)) seenSlides.add(index)
  })
  filmstrip.value?.children[current]?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
  })
})

// Staff add a release or variant in place; others submit one for review
const addReleaseTarget = computed(() =>
  submissionTarget(editable.value, () => openReleaseForm(), 'keyboard', {
    brand: route.params.brand,
    keyboard: slug.value,
  }),
)

const addVariantTarget = (release) =>
  submissionTarget(
    editable.value,
    () => openVariantForm({ release_id: release.id }),
    'keyboard',
    { brand: route.params.brand, keyboard: slug.value, release: release.id },
  )

// The trail ends at the parent page (shown, not marked current): the page
// header names this one
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
      active: false,
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
  ]
})

// Staff forms and the delete confirmation, one of each for the whole page.
const editing = ref(false)
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
  editing.value = false
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

const deleteRelease = (release) =>
  openDelete(
    'Release',
    release.name,
    `/api/keyboards/${release.brand_keyboard_slug}/releases/${release.id}`,
  )

const deleteVariant = (variant) =>
  openDelete(
    'Variant',
    variant.variant_name,
    `/api/keyboards/${variant.brand_keyboard_slug}/variants/${variant.id}`,
  )

// One drawer shows whichever variant was opened
const variantDrawer = reactive({ open: false, release: {}, variant: {} })

const openVariant = (variant, release) => {
  Object.assign(variantDrawer, { open: true, release, variant })
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
  title,
  description,
})

defineOgImage('Module', {
  title: data.value?.name,
  description: description.value,
  headline: data.value?.brand?.name,
  headlineLogo: logoUrl(data.value?.brand?.slug),
})
</script>
