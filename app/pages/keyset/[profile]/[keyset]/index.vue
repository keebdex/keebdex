<template>
  <UDashboardPanel :id="`keyset-${profile}-${keyset}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Smaller cover share on wide screens; the page stays full width.
           Without a usable cover the details spread across the row instead. -->
      <div
        :class="
          showCover && 'grid grid-cols-1 lg:grid-cols-5 2xl:grid-cols-2 gap-8'
        "
      >
        <!-- Left: cover image -->
        <div v-if="showCover" class="lg:col-span-3 2xl:col-span-1">
          <NuxtImg
            fetchpriority="high"
            sizes="xs:96vw lg:48vw 2xl:44vw"
            :src="coverImg"
            :alt="fullName"
            class="w-full aspect-video rounded-lg border border-default object-cover cursor-zoom-in"
            @error="coverFailed = true"
            @click="openPreview({ title: fullName, url: coverImg })"
          />
        </div>

        <!-- Right: identity and specifications -->
        <div
          :class="['space-y-6', showCover && 'lg:col-span-2 2xl:col-span-1']"
        >
          <UPageHeader
            :title="fullName"
            :description="data.description"
            :ui="{
              root: 'pt-0 pb-4',
              // Actions on their own row: beside the cover the title column
              // is too narrow for them
              wrapper: 'lg:flex-col lg:items-start gap-3',
              links: 'flex flex-wrap gap-2',
              title: 'text-2xl',
              description: 'text-sm',
            }"
          >
            <!-- The page's actions; the reference links sit under the specs -->
            <template v-if="authenticated || canAddCover" #links>
              <SharedSaveToCollection
                v-if="authenticated"
                :item="data"
                :item-name="fullName"
                category="keyset"
                label="Save"
                keep-label
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
                  icon="hugeicons:image-add-02"
                  aria-label="Add Cover"
                  @click="suggest('keyset', data)"
                />
              </UTooltip>
            </template>
          </UPageHeader>

          <section v-if="specs.length" class="space-y-3">
            <h2 class="text-xs uppercase tracking-widest text-muted">
              Specifications
            </h2>
            <SharedSpecList :items="specs" layout="grid" :columns="3" />
          </section>

          <!-- Where the set was discussed and how it sold, with labels -->
          <div v-if="referenceLinks.length" class="flex flex-wrap gap-2">
            <UButton
              v-for="link in referenceLinks"
              :key="link.label"
              v-bind="link"
              :ui="{ label: 'block' }"
            />
          </div>
        </div>
      </div>

      <!-- Kits, headed like a keyboard's releases -->
      <section class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-highlighted">
            Kits
            <span v-if="kits.length" class="text-muted font-normal">
              ({{ kits.length }})
            </span>
          </h2>

          <UTooltip v-if="authenticated" text="Add Kit">
            <UButton
              icon="hugeicons:dashboard-square-add"
              variant="ghost"
              aria-label="Add Kit"
              v-bind="addKitTarget"
            />
          </UTooltip>
        </div>

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
                <UIcon name="hugeicons:package" class="size-4" />
                <span class="tabular-nums">
                  {{ formatNumber(kit.qty) }} units
                </span>
              </div>
            </template>
          </SharedCatalogCard>
        </UPageGrid>

        <UEmpty
          v-else
          icon="hugeicons:cells"
          title="No Kits Yet"
          :description="
            authenticated
              ? 'Add the base kit first, then alphas, novelties, and spacebars.'
              : 'The kits of this keyset have not been added yet.'
          "
          :actions="
            authenticated
              ? [
                  {
                    label: 'Add Kit',
                    icon: 'hugeicons:dashboard-square-add',
                    ui: { label: 'block' },
                    ...addKitTarget,
                  },
                ]
              : []
          "
        />
      </section>

      <!-- Colors: added and removed, never edited -->
      <section v-if="data.colors?.length || editable" class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-highlighted">Color Palette</h2>

          <UTooltip v-if="editable" text="Add Colors">
            <UButton
              icon="hugeicons:dashboard-circle-add"
              variant="ghost"
              aria-label="Add Colors"
              @click="colorFormOpen = true"
            />
          </UTooltip>
        </div>

        <template v-if="data.colors?.length">
          <p class="text-sm text-muted">
            Colors displayed on screen are for reference only - use a physical
            color fan for accurate matching. Some codes are from the designer
            and may differ from official references (RAL, Pantone, etc.).
          </p>

          <div
            class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4"
          >
            <KeysetColorCard
              v-for="color in data.colors"
              :key="color.id"
              v-bind="color.color"
            >
              <template v-if="editable" #action>
                <UTooltip text="Remove">
                  <UButton
                    icon="hugeicons:dashboard-circle-remove"
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
            </KeysetColorCard>
          </div>
        </template>

        <UEmpty
          v-else
          icon="hugeicons:colors"
          title="No Colors Yet"
          description="Add the alpha and modifier colors first, then the accents."
          :actions="[
            {
              label: 'Add Colors',
              icon: 'hugeicons:dashboard-circle-add',
              ui: { label: 'block' },
              onClick: () => (colorFormOpen = true),
            },
          ]"
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
              :ui="{ prev: 'start-2 sm:start-2', next: 'end-2 sm:end-2' }"
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

const { data, refresh } = await useAsyncData(
  `keyset/${profile}/${keyset}`,
  () => $fetch(`/api/keysets/${profile}/${keyset}`),
  {
    watch: [() => profile, () => keyset],
  },
)

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
      label: manufacturers.value[profile],
      to: `/keyset/${profile}`,
    },
    {
      label: data.value.name,
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
      icon: 'hugeicons:comment-01',
      to: data.value.url,
      target: '_blank',
      external: true,
    })
  }

  if (data.value.order_graph) {
    links.push({
      label: 'Order Graph',
      icon: 'hugeicons:chart-bar-big',
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
      icon: 'hugeicons:chart-line-data-02',
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
      icon: 'hugeicons:user-edit-01',
    },
    {
      term: 'Row Sculpt',
      description: data.value.sculpt,
      icon: 'hugeicons:align-vertical-center',
    },
    {
      term: 'IC Date',
      description: formatDate(data.value.ic_date),
      icon: 'hugeicons:bulb',
    },
    {
      term: 'Timeline',
      description: formatDateRange(data.value.start_date, data.value.end_date),
      icon: 'hugeicons:calendar-03',
    },
  ].filter((item) => item.description)

  const phase = keysetPhase(data.value)

  if (phase) {
    items.push({
      term: 'Status',
      icon: 'hugeicons:activity-01',
      badge: { label: phase, color: keysetPhaseColors[phase] },
    })
  }

  return items
})

// Staff add a kit in place; others submit one for review
const addKitTarget = computed(() =>
  editable.value
    ? { onClick: () => openKitForm() }
    : {
        to: {
          path: '/keyset/submissions/submit',
          query: { profile, keyset: data.value.profile_keyset_id },
        },
      },
)

const keysetFormOpen = ref(false)
const colorFormOpen = ref(false)
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

const meta = computed(() => {
  return {
    title: data.value
      ? `${data.value.profile.name} ${data.value.name}`
      : manufacturers.value[profile],
    description: data.value?.description,
  }
})

useSeoMeta({
  title: meta.value.title,
  description: meta.value.description,
  ogDescription: meta.value.description,
  twitterDescription: meta.value.description,
})

defineOgImage('Base', {
  title: meta.value.title,
  description: meta.value.description,
})
</script>
