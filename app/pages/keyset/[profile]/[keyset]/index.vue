<template>
  <UDashboardPanel :id="`keyset-${profile}-${keyset}`">
    <template #header>
      <SharedBreadcrumbNavbar :items="breadcrumbs" />
    </template>

    <template #body>
      <!-- The cover beside the keyset's name, story, and specs; without a
           usable cover the details spread across the row instead -->
      <SharedDetailHero>
        <template v-if="showCover" #media>
          <NuxtImg
            fetchpriority="high"
            sizes="xs:96vw lg:48vw 2xl:44vw 3xl:752px"
            :src="coverImg"
            :alt="fullName"
            class="w-full aspect-video rounded-lg border border-default object-cover cursor-zoom-in"
            @error="coverFailed = true"
            @click="openPreview({ title: fullName, url: coverImg })"
          />
        </template>

        <UPageHeader
          :title="fullName"
          :description="data.description"
          :ui="detailPageHeaderUi(showCover)"
        >
          <!-- The page's actions; the reference links sit under the specs -->
          <template v-if="authenticated || canAddCover" #links>
            <SharedSaveToCollection
              v-if="authenticated"
              :item="data"
              :item-name="fullName"
              category="keyset"
              @on-select="saveTo"
            />

            <SharedRecordActions
              :editable="editable"
              :suggestable="canSuggest(data)"
              label="Keyset"
              @edit="keysetFormOpen = true"
              @suggest="suggest('keyset', data)"
              @history="history?.show()"
            />

            <!-- No cover to show: invite the community to add one -->
            <UTooltip v-if="canAddCover" text="Add Cover">
              <UButton
                icon="solar:gallery-add-bold-duotone"
                aria-label="Add Cover"
                @click="suggest('keyset', data)"
              />
            </UTooltip>
          </template>
        </UPageHeader>

        <!-- One row per spec, like the keyboard page -->
        <SharedSpecList v-if="specs.length" :items="specs" layout="rows" />

        <!-- Where the set was discussed and how it sold, with labels -->
        <div v-if="referenceLinks.length" class="flex flex-wrap gap-2">
          <UButton
            v-for="link in referenceLinks"
            :key="link.label"
            v-bind="link"
            :ui="{ label: 'block' }"
          />
        </div>
      </SharedDetailHero>

      <!-- Kits and colors are headed by section-sized page headers (an h2
           title), with ghost actions so they don't read as the page's own -->
      <section class="space-y-4 pt-4">
        <UPageHeader
          title="Kits"
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        >
          <template v-if="authenticated" #links>
            <UTooltip text="Add Kit">
              <UButton
                icon="solar:widget-add-bold-duotone"
                variant="ghost"
                aria-label="Add Kit"
                v-bind="addKitTarget"
              />
            </UTooltip>
          </template>
        </UPageHeader>

        <UPageGrid v-if="kits.length">
          <SharedCatalogCard
            v-for="kit in kits"
            :key="kit.id"
            :title="kitLabel(kit)"
            :description="kit.description"
            :price="
              kit.price && formatPrice(kit.price, 'USD', { stripZeros: true })
            "
            :price-struck="kit.cancelled"
            :img="kit.img"
            fallback="/keyset.png"
            :editable="editable"
            :suggestable="canSuggest(kit)"
            class="cursor-zoom-in"
            @click="openKitPreview(kit)"
            @edit="openKitForm(kit)"
            @suggest="suggest('keyset_kit', kit)"
            @history="showHistory('keyset_kit', kit.id, kitLabel(kit))"
            @delete="
              openDelete(
                'Kit',
                kitLabel(kit),
                `/api/keysets/${kit.profile_keyset_id}/kits/${kit.id}`,
              )
            "
          >
            <template #badges>
              <UBadge
                v-if="kit.cancelled"
                label="Cancelled"
                color="error"
                variant="solid"
                class="absolute top-2 right-2"
              />
            </template>

            <template v-if="kit.qty" #footer-start>
              <div class="flex items-center gap-1.5 text-xs text-muted">
                <UIcon name="solar:box-bold-duotone" class="size-4" />
                <span class="tabular-nums">
                  {{ formatNumber(kit.qty) }} units
                </span>
              </div>
            </template>
          </SharedCatalogCard>
        </UPageGrid>

        <UEmpty
          v-else
          icon="solar:grid-3x3-bold-duotone"
          title="No Kits Yet"
          :description="
            authenticated
              ? 'Add the base kit first, then alphas, novelties, and spacebars.'
              : 'The kits of this keyset have not been added yet.'
          "
        />
      </section>

      <!-- Colors: added and removed, never edited -->
      <section v-if="data.colors?.length || editable" class="space-y-4 pt-4">
        <UPageHeader
          title="Color Palette"
          :description="
            data.colors?.length
              ? 'Colors displayed on screen are for reference only - use a physical color fan for accurate matching. Some codes are from the designer and may differ from official references (RAL, Pantone, etc.).'
              : undefined
          "
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        >
          <template v-if="editable" #links>
            <UTooltip text="Add Colors">
              <UButton
                icon="solar:widget-add-bold-duotone"
                variant="ghost"
                aria-label="Add Colors"
                @click="colorFormOpen = true"
              />
            </UTooltip>
          </template>
        </UPageHeader>

        <div v-if="data.colors?.length" :class="colorPaletteGridClass">
          <KeysetColorTile
            v-for="color in data.colors"
            :key="color.id"
            :color="color.color"
            compact
            @select="selectColor"
          >
            <template v-if="editable" #action>
              <UTooltip text="Remove">
                <UButton
                  icon="solar:close-square-bold-duotone"
                  size="xs"
                  color="error"
                  variant="ghost"
                  aria-label="Remove Color"
                  @click="
                    openDelete(
                      'Color',
                      `${color.color.system} ${color.color.code}`,
                      `/api/keysets/${color.profile_keyset_id}/colors/${color.id}`,
                    )
                  "
                />
              </UTooltip>
            </template>
          </KeysetColorTile>
        </div>

        <UEmpty
          v-else
          icon="solar:palette-round-bold-duotone"
          title="No Colors Yet"
          description="Add the alpha and modifier colors first, then the accents."
        />
      </section>

      <template v-if="editable">
        <SharedRevisionHistory
          ref="history"
          domain="keyset"
          :parent-key="`${profile}/${keyset}`"
          description="Every change to this keyset and its kits, newest first."
          @reverted="onReverted"
        />

        <UModal v-model:open="keysetFormOpen" title="Edit Keyset">
          <template #body>
            <KeysetModalKeysetForm
              :is-edit="true"
              :metadata="data"
              @on-success="onFormSuccess"
            />
          </template>
        </UModal>

        <UModal
          v-model:open="kitForm.open"
          :title="kitForm.isEdit ? 'Edit Kit' : 'Add Kit'"
          :description="
            kitForm.isEdit
              ? undefined
              : 'Add the base and alpha kits before novelties, spacebars, and other extras.'
          "
        >
          <template #body>
            <KeysetModalKeysetKitForm
              :is-edit="kitForm.isEdit"
              :metadata="kitForm.metadata"
              @on-success="onFormSuccess"
            />
          </template>
        </UModal>

        <UModal v-model:open="colorFormOpen" title="Add Colors">
          <template #body>
            <KeysetModalKeysetColorForm @on-success="onFormSuccess" />
          </template>
        </UModal>

        <SharedConfirmModal
          v-model:open="deleteTarget.open"
          :title="`Remove ${deleteTarget.entity}`"
          :description="`Are you sure you want to remove ${deleteTarget.entity.toLowerCase()} '${deleteTarget.name}'? This action cannot be undone.`"
          confirm-label="Remove"
          :loading="deleting"
          @confirm="confirmDelete"
        />
      </template>

      <!-- A palette color's values and the other keysets that use it -->
      <KeysetColorDrawer
        v-model:open="colorDrawerOpen"
        :color-id="selectedColorId"
        :preview="
          data.colors?.find((item) => item.color.id === selectedColorId)?.color
        "
        :exclude="`${profile}/${keyset}`"
      />

      <SharedSuggestEditModal
        v-if="suggestTarget"
        v-model:open="suggestOpen"
        :entity-type="suggestTarget.entityType"
        :record="suggestTarget.record"
        :form-props="suggestTarget.formProps"
      />

      <UModal
        v-model:open="preview.open"
        :title="previewKit ? kitLabel(previewKit) : preview.title"
        :description="
          (previewKit ? previewKit.description : preview.description) ||
          undefined
        "
        :ui="{ content: 'max-w-5xl' }"
      >
        <template #body>
          <!-- Opened from a kit: swipe, arrows, or arrow keys through every kit -->
          <template v-if="previewKit">
            <UCarousel
              ref="kitCarousel"
              v-slot="{ item }"
              :items="previewKits"
              :start-index="kitStart"
              loop
              :arrows="previewKits.length > 1"
              @select="preview.kitIndex = $event"
            >
              <NuxtImg
                :src="item.img"
                :alt="kitLabel(item)"
                loading="lazy"
                decoding="async"
                class="w-full aspect-video rounded-lg object-contain"
              />
            </UCarousel>

            <p
              v-if="previewKits.length > 1"
              class="mt-3 text-center text-sm text-muted tabular-nums"
            >
              {{ preview.kitIndex + 1 }} / {{ previewKits.length }}
            </p>
          </template>

          <NuxtImg
            v-else-if="preview.url"
            :src="preview.url"
            :alt="preview.title"
            class="w-full rounded-lg object-contain"
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()
const { authenticated } = storeToRefs(userStore)

const { manufacturers } = useKeysetProfiles()

const { profile, keyset } = route.params
const editable = computed(() => userStore.isEditable(`${profile}/${keyset}`))

const {
  target: suggestTarget,
  open: suggestOpen,
  canSuggest,
  suggest,
} = useSuggestEdit(editable)

const { data, refresh, error } = await useAsyncData(
  `keyset/${profile}/${keyset}`,
  () => $fetch(`/api/keysets/${profile}/${keyset}`),
  {
    watch: [() => profile, () => keyset],
  },
)

throwIfNotFound(error.value)

// Reverting a rename moves the page back to its old address.
const onReverted = ({ entityType, changes }) => {
  if (entityType === 'keyset' && changes.slug) {
    return navigateTo(`/keyset/${profile}/${changes.slug}`)
  }

  refresh()
}

const breadcrumbs = computed(() => {
  return [
    {
      label: 'Profiles',
      icon: 'solar:add-square-bold-duotone',
      to: '/keyset',
    },
    {
      label: manufacturers.value[profile],
      to: `/keyset/${profile}`,
    },
  ]
})

// The interest check thread and dvorcol's order charts; vendor pages are
// left out, since they go stale once the group buy ends
const referenceLinks = computed(() => {
  const links = []

  if (data.value.url?.includes('geekhack')) {
    links.push({
      label: 'Geekhack',
      icon: 'solar:chat-square-bold-duotone',
      to: data.value.url,
      target: '_blank',
      external: true,
    })
  }

  if (data.value.order_graph) {
    links.push({
      label: 'Order Graph',
      icon: 'solar:chart-bold-duotone',
      onClick: () =>
        openPreview({
          title: 'Order Graph',
          url: data.value.order_graph,
          description: 'Created by dvorcol',
        }),
    })
  }

  if (data.value.order_history) {
    links.push({
      label: 'Order History',
      icon: 'solar:graph-up-bold-duotone',
      onClick: () =>
        openPreview({
          title: 'Order History',
          url: data.value.order_history,
          description: 'Created by dvorcol',
        }),
    })
  }

  return links
})

const fullName = computed(() =>
  [data.value.profile?.name, data.value.name].filter(Boolean).join(' '),
)

const kits = computed(() => data.value?.kits || [])

const history = useTemplateRef('history')

// History of one kit, from its card
const showHistory = (entityType, entityId, label) => {
  history.value?.show({ record: { entityType, entityId, label } })
}

const kitLabel = (kit) => kit.name || kit.category?.name || 'Kit'

// Prefer the keyset's own cover, then the first kit render; no placeholder
const coverImg = computed(
  () => data.value?.img || kits.value.find((kit) => kit.img)?.img || '',
)

// NuxtImg also reports an image that failed during SSR once it mounts
const coverFailed = ref(false)
const showCover = computed(() => !!coverImg.value && !coverFailed.value)
const canAddCover = computed(() => !showCover.value && canSuggest(data.value))

watch(coverImg, () => {
  coverFailed.value = false
})

// What the set is, then when and how it was sold
const specs = computed(() => {
  const items = [
    {
      term: 'Designer',
      description: data.value.designer,
      icon: 'solar:user-speak-bold-duotone',
    },
    {
      term: 'Row Sculpt',
      description: data.value.sculpt,
      icon: 'solar:align-vertical-center-bold-duotone',
    },
    {
      term: 'IC Date',
      description: formatDate(data.value.ic_date),
      icon: 'solar:lightbulb-bold-duotone',
    },
    {
      term: 'Timeline',
      description: formatDateRange(data.value.start_date, data.value.end_date),
      icon: 'solar:calendar-bold-duotone',
    },
  ].filter((item) => item.description)

  const phase = keysetPhase(data.value)

  if (phase) {
    items.push({
      term: 'Status',
      icon: 'solar:pulse-bold-duotone',
      badge: { label: phase, color: keysetPhaseColors[phase] },
    })
  }

  return items
})

// Staff add a kit in place; others submit one for review
const addKitTarget = computed(() =>
  submissionTarget(editable.value, () => openKitForm(), 'keyset', {
    profile,
    keyset: data.value.profile_keyset_id,
  }),
)

const keysetFormOpen = ref(false)
const colorFormOpen = ref(false)

// The open palette color is in the URL (`?color=<id>`), as on the Colors page
const {
  id: selectedColorId,
  open: colorDrawerOpen,
  select: selectColor,
} = useQuerySelection('color')
const kitForm = reactive({ open: false, isEdit: false, metadata: {} })

const openKitForm = (kit) => {
  Object.assign(kitForm, {
    open: true,
    isEdit: !!kit,
    metadata: { ...kit },
  })
}

const onFormSuccess = () => {
  keysetFormOpen.value = false
  colorFormOpen.value = false
  kitForm.open = false
  refresh()
}

const {
  target: deleteTarget,
  deleting,
  open: openDelete,
  confirm: confirmDelete,
} = useConfirmDelete(refresh)

const preview = reactive({
  open: false,
  title: '',
  url: '',
  description: '',
  // Position in `previewKits` when a kit is shown, else -1 (cover, graphs)
  kitIndex: -1,
})

function openPreview({ title, url, description = '' }) {
  if (!url) return
  Object.assign(preview, { open: true, title, url, description, kitIndex: -1 })
}

// Kits with a render, which the preview shows as a carousel
const previewKits = computed(() => kits.value.filter((kit) => kit.img))
const previewKit = computed(() => previewKits.value[preview.kitIndex])

// Slide the carousel opens on; kept apart from `kitIndex`, since changing it
// re-initializes the carousel
const kitStart = ref(0)

function openKitPreview(kit) {
  const index = previewKits.value.indexOf(kit)

  if (index < 0) return

  kitStart.value = index
  Object.assign(preview, { open: true, kitIndex: index })
}

const kitCarousel = useTemplateRef('kitCarousel')

// The carousel only handles arrow keys while focused, and the modal opens with
// focus on its close button, so the page listens too while a kit is shown.
function stepKit(event, direction) {
  if (event.target?.closest?.('[aria-roledescription="carousel"]')) return

  kitCarousel.value?.emblaApi?.[direction]()
}

defineShortcuts(
  computed(() =>
    preview.open && previewKits.value.length > 1 && previewKit.value
      ? {
          arrowleft: (event) => stepKit(event, 'scrollPrev'),
          arrowright: (event) => stepKit(event, 'scrollNext'),
        }
      : {},
  ),
)

const { addItem } = useCollectionItem()

const saveTo = (collection, item) => {
  addItem(collection, { keyset_item_id: item.profile_keyset_id }, item.name)
}

// Search titles keep the manufacturer (GMK CYL Olivia), which the heading
// leaves to the breadcrumbs
const meta = computed(() => {
  if (!data.value) {
    return { title: manufacturers.value[profile] }
  }

  const title = `${keysetProfileLabel(data.value.profile)} ${data.value.name}`

  return {
    title,
    description:
      data.value.description ||
      `Kits, colors, and group buy details of the ${title} keyset.`,
  }
})

useSeoMeta({
  title: () => meta.value.title,
  description: () => meta.value.description,
})

defineOgImage('Base', {
  title: meta.value.title,
  description: meta.value.description,
})
</script>
