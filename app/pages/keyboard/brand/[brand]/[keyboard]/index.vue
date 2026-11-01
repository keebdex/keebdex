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
      <!-- The catalog entry: the featured photo with the other variants as
           a filmstrip, beside the keyboard's name, story, and record -->
      <section
        class="grid gap-6 lg:gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
      >
        <!-- Stays in view beside the taller record on wide screens -->
        <figure class="min-w-0 space-y-3 lg:sticky lg:top-0 lg:self-start">
          <button
            type="button"
            class="group relative block w-full overflow-hidden rounded-lg border border-default bg-elevated"
            :disabled="!featured"
            :aria-label="
              featured ? `Open ${featured.variant.variant_name}` : undefined
            "
            @click="featured && openVariant(featured.variant, featured.release)"
          >
            <NuxtImg
              :src="featured?.img || '/keyboard.png'"
              :alt="
                featured ? `${title} ${featured.variant.variant_name}` : title
              "
              sizes="100vw lg:60vw"
              fetchpriority="high"
              class="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <figcaption
              v-if="featured"
              class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-black/70 to-transparent p-4 pt-12 text-start text-white"
            >
              <span class="min-w-0">
                <span class="block truncate font-semibold">
                  {{ featured.variant.variant_name }}
                </span>
                <span class="block truncate text-xs text-white/75">
                  {{ featured.release.name }}
                </span>
              </span>
              <span
                v-if="featured.variant.price"
                class="shrink-0 text-sm font-medium tabular-nums"
              >
                {{ featured.variant.price }}
              </span>
            </figcaption>
          </button>

          <!-- Every variant with a photo; picking one features it -->
          <div
            v-if="photoRows.length > 1"
            class="flex gap-2 overflow-x-auto pb-1"
            role="listbox"
            aria-label="Variants"
          >
            <button
              v-for="row in photoRows"
              :key="row.id"
              type="button"
              role="option"
              :aria-selected="row.id === featured?.id"
              :aria-label="row.variant.variant_name"
              class="shrink-0 overflow-hidden rounded-md border-2 transition-opacity"
              :class="
                row.id === featured?.id
                  ? 'border-primary'
                  : 'border-transparent opacity-60 hover:opacity-100'
              "
              @click="featuredId = row.id"
            >
              <NuxtImg
                :src="row.img"
                :alt="row.variant.variant_name"
                sizes="96px"
                loading="lazy"
                decoding="async"
                class="aspect-video w-20 object-cover"
              />
            </button>
          </div>
        </figure>

        <div class="min-w-0 space-y-5">
          <div class="space-y-2">
            <ULink
              :to="`/keyboard/brand/${data.brand?.slug}`"
              class="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-highlighted"
            >
              <UAvatar
                :src="logoUrl(data.brand?.slug)"
                :alt="data.brand?.name"
                size="xs"
                :ui="{
                  root: 'bg-transparent rounded-none',
                  image: data.brand?.invertible_logo
                    ? 'rounded-none dark:invert'
                    : 'rounded-none',
                }"
              />
              {{ data.brand?.name }}
            </ULink>

            <h1
              class="text-3xl sm:text-4xl font-bold tracking-tight text-highlighted text-pretty"
            >
              {{ data.name }}
            </h1>

            <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span
                class="font-mono uppercase tracking-wider text-dimmed"
                :title="'Catalog ID'"
              >
                {{ data.brand_keyboard_slug }}
              </span>
              <span v-if="data.original" class="text-muted">
                Based on
                <ULink
                  :to="`/keyboard/brand/${data.derived_from}`"
                  class="font-medium text-highlighted hover:underline"
                >
                  {{ originalName }}
                </ULink>
              </span>
            </p>
          </div>

          <SharedDescription
            v-if="data.description"
            :description="data.description"
            class="text-sm text-muted"
          />

          <!-- The page's actions sit with the keyboard they act on -->
          <div v-if="authenticated" class="flex flex-wrap gap-2">
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
          </div>

          <!-- The design every release shares -->
          <dl class="divide-y divide-default border-y border-default">
            <div
              v-for="item in keyboardSpecs"
              :key="item.term"
              class="flex items-baseline justify-between gap-4 py-2"
            >
              <dt class="flex shrink-0 items-center gap-2 text-sm text-muted">
                <UIcon :name="item.icon" class="size-4 self-center" />
                {{ item.term }}
              </dt>
              <dd class="min-w-0 text-end text-sm font-medium text-highlighted">
                {{ item.description || '—' }}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <template v-if="releases.length">
        <!-- Every release as a UTimeline item, in the release order staff
             set (newest first): its name and actions as the title, then its
             story, specs, and variants as cards. Every item is marked done,
             so the whole rail takes the primary color. -->
        <section class="space-y-6 border-t border-default pt-8 mt-10">
          <UPageHeader
            title="Production History"
            :as="detailSectionHeaderAs"
            :ui="detailSectionHeaderUi"
          />

          <UTimeline
            :items="timelineItems"
            :default-value="timelineItems.length - 1"
            size="sm"
            :ui="{
              item: 'gap-4',
              wrapper: 'min-w-0 flex-1 pb-10 group-last:pb-0',
              title: 'text-lg font-semibold',
              description: 'mt-3 space-y-4',
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
                    @delete="
                      openDelete(
                        'Release',
                        release.name,
                        `/api/keyboards/${release.brand_keyboard_slug}/releases/${release.id}`,
                      )
                    "
                  />
                </div>
              </div>
            </template>

            <template #description="{ item: { release } }">
              <SharedDescription
                v-if="release.description"
                :description="release.description"
                class="line-clamp-3"
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
                  :img="variant.img_front || variant.img_back"
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
                      label="Save"
                      keep-label
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
        class="mt-10"
      />

      <!-- Where the design comes from and where it went -->
      <section
        v-if="data.original || data.derived_keyboards?.length"
        class="space-y-4 border-t border-default pt-8 mt-10"
      >
        <UPageHeader
          title="Lineage"
          description="The design this keyboard builds on, and the community reworks, collaborations, and iterations that share its DNA."
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        />

        <UPageGrid>
          <UPageCard
            v-if="data.original"
            :to="`/keyboard/brand/${data.derived_from}`"
            :title="originalName"
            description="Original design"
            icon="hugeicons:git-branch"
            spotlight
          />

          <UPageCard
            v-for="keyboard in data.derived_keyboards"
            :key="keyboard.brand_keyboard_slug"
            :to="`/keyboard/brand/${keyboard.brand_keyboard_slug}`"
            :title="`${keyboard.brand?.name} ${keyboard.name}`"
            description="Derived design"
            :container="imageCardContainerClass"
            reverse
            spotlight
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
      // Prices show on the variant cards.
      specs: releaseSpecItems(release, data.value),
      variants: (release.variants || []).filter(isApproved).map((variant) => {
        const { price, custom } = resolveVariantSpecs(variant, release)

        return {
          ...variant,
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
    value: release.id,
    icon: 'hugeicons:delivery-view-01',
    release,
  })),
)

// The featured photo: the newest variant with one until another is picked
const photoRows = computed(() =>
  releases.value.flatMap((release) =>
    release.variants
      .filter((variant) => variant.img_front || variant.img_back)
      .map((variant) => ({
        id: variant.id,
        img: variant.img_front || variant.img_back,
        variant,
        release,
      })),
  ),
)
const featuredId = ref(null)

const featured = computed(
  () =>
    photoRows.value.find((row) => row.id === featuredId.value) ||
    photoRows.value[0] ||
    null,
)

// Staff add a release or variant in place; others submit one for review
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
