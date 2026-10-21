<template>
  <UDashboardPanel :id="`keyset-${profile}-${keyset}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal v-if="editable" v-model:visible="visible" title="Edit Keyset">
            <UButton label="Edit" icon="hugeicons:edit-01" />

            <template #body="{ close }">
              <KeysetModalKeysetForm
                :is-edit="true"
                :metadata="data"
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>

          <UButton
            v-if="editable"
            label="Kits"
            icon="hugeicons:cells"
            :to="`/keyset/${data.profile_keyset_id}/kit`"
          />

          <UButton
            v-if="editable"
            label="Colors"
            icon="hugeicons:colors"
            :to="`/keyset/${data.profile_keyset_id}/color`"
          />

          <SharedRevisionHistory
            v-if="editable"
            ref="history"
            domain="keyset"
            :parent-key="`${profile}/${keyset}`"
            description="Every change to this keyset and its kits, newest first."
            @reverted="refresh"
          />

          <UButton
            v-else-if="authenticated"
            label="Add Kit"
            icon="hugeicons:cells"
            :to="submitKitLink"
          />

          <UButton
            v-if="canSuggest(data)"
            label="Edit"
            icon="hugeicons:edit-01"
            @click="suggest('keyset', data)"
          />

          <SharedSaveToCollection
            v-if="authenticated"
            :item="data"
            category="keyset"
            label="Save"
            @on-select="saveTo"
          />
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

        <!-- Right: identity, catalog details, group buy history -->
        <div
          :class="['space-y-6', showCover && 'lg:col-span-2 2xl:col-span-1']"
        >
          <UPageHeader
            :title="fullName"
            :description="data.description"
            :ui="{
              root: 'pt-0 pb-4',
              // Keep the icon links on the title row at every width
              wrapper: 'flex-row items-center justify-between',
              links: 'shrink-0',
              title: 'text-2xl',
              description: 'text-sm',
            }"
          >
            <!-- Icon-only reference links beside the title; the tooltip and
                 aria-label carry the name -->
            <template v-if="externalLinks.length || canAddCover" #links>
              <UTooltip
                v-for="{ label, ...link } in externalLinks"
                :key="label"
                :text="label"
              >
                <UButton v-bind="link" :aria-label="label" />
              </UTooltip>

              <!-- No cover to show: invite the community to add one -->
              <UTooltip v-if="canAddCover" text="Add Cover">
                <UButton
                  icon="hugeicons:image-add-02"
                  variant="ghost"
                  aria-label="Add Cover"
                  @click="suggest('keyset', data)"
                />
              </UTooltip>
            </template>
          </UPageHeader>

          <div
            :class="
              showCover ? 'space-y-6' : 'grid grid-cols-1 sm:grid-cols-2 gap-6'
            "
          >
            <section v-if="details.length" class="space-y-3">
              <h2 class="text-xs uppercase tracking-widest text-muted">
                Details
              </h2>
              <SharedDescriptionList
                :columns="1"
                orientation="horizontal"
                :items="details"
              />
            </section>

            <section v-if="groupBuy.length" class="space-y-3">
              <h2 class="text-xs uppercase tracking-widest text-muted">
                Group Buy
              </h2>
              <SharedDescriptionList
                :columns="1"
                orientation="horizontal"
                :items="groupBuy"
              />
            </section>
          </div>
        </div>
      </div>

      <!-- Kits -->
      <section class="space-y-4">
        <h2 class="text-lg font-semibold text-highlighted">
          Kits
          <span v-if="kits.length" class="text-muted font-normal">
            ({{ kits.length }})
          </span>
        </h2>

        <UPageGrid v-if="kits.length">
          <UPageCard
            v-for="kit in kits"
            :key="kit.id"
            :title="kitLabel(kit)"
            :description="kit.description || undefined"
            reverse
            spotlight
            class="cursor-zoom-in"
            :ui="{
              body: 'w-full',
              description: 'text-sm line-clamp-2',
              footer: 'pt-3',
            }"
            @click="openKitPreview(kit)"
          >
            <!-- Name with its group buy price, catalog style -->
            <template #title>
              <div class="flex items-baseline justify-between gap-3">
                <span class="truncate">{{ kitLabel(kit) }}</span>
                <span
                  v-if="kit.price"
                  class="shrink-0 tabular-nums"
                  :class="kit.cancelled && 'line-through text-muted'"
                >
                  {{ formatPrice(kit.price, 'USD', { stripZeros: true }) }}
                </span>
              </div>
            </template>

            <template v-if="kit.qty || canSuggest(kit) || editable" #footer>
              <div class="flex w-full items-center justify-between gap-2">
                <div
                  v-if="kit.qty"
                  class="flex items-center gap-1.5 text-xs text-muted"
                >
                  <UIcon name="hugeicons:package" class="size-4" />
                  <span class="tabular-nums">
                    {{ formatNumber(kit.qty) }} units
                  </span>
                </div>

                <UTooltip v-if="canSuggest(kit)" text="Edit">
                  <UButton
                    icon="hugeicons:edit-01"
                    size="xs"
                    variant="ghost"
                    aria-label="Edit"
                    class="ms-auto"
                    @click.stop="suggest('keyset_kit', kit)"
                  />
                </UTooltip>

                <UTooltip v-if="editable" text="History">
                  <UButton
                    icon="hugeicons:time-quarter-pass"
                    size="xs"
                    variant="ghost"
                    aria-label="History"
                    class="ms-auto"
                    @click.stop="
                      history?.show({
                        record: {
                          entityType: 'keyset_kit',
                          entityId: kit.id,
                          label: kitLabel(kit),
                        },
                      })
                    "
                  />
                </UTooltip>
              </div>
            </template>

            <div class="relative">
              <NuxtImg
                preset="cover"
                loading="lazy"
                decoding="async"
                :src="kit.img || '/keyset.png'"
                :alt="kitLabel(kit)"
                class="w-full aspect-video object-cover rounded"
              />
              <UBadge
                v-if="kit.cancelled"
                label="Cancelled"
                color="error"
                variant="solid"
                class="absolute top-2 right-2"
              />
              <UButton
                v-if="!kit.img && canSuggest(kit)"
                label="Add Photo"
                icon="hugeicons:image-add-02"
                size="sm"
                :ui="{ label: 'block' }"
                class="absolute bottom-2 right-2"
                @click.stop="suggest('keyset_kit', kit)"
              />
            </div>
          </UPageCard>
        </UPageGrid>

        <p v-else class="text-sm text-muted">
          No kits have been added yet.
          <ULink
            v-if="authenticated && !editable"
            :to="submitKitLink"
            class="text-primary"
          >
            Add a kit
          </ULink>
        </p>
      </section>

      <!-- Colors -->
      <section v-if="data.colors?.length" class="space-y-4">
        <h2 class="text-lg font-semibold text-highlighted">Color Palette</h2>
        <p class="text-sm text-muted">
          Colors displayed on screen are for reference only - use a physical
          color fan for accurate matching. Some codes are from the designer and
          may differ from official references (RAL, Pantone, etc.).
        </p>

        <div
          class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4"
        >
          <KeysetColorCard
            v-for="color in data.colors"
            :key="color.id"
            v-bind="color.color"
          />
        </div>
      </section>
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

const externalLinks = computed(() => {
  const links = []

  if (data.value.url) {
    if (data.value.url.includes('geekhack')) {
      links.push({
        label: 'Geekhack',
        icon: 'hugeicons:comment-01',
        to: data.value.url,
        target: '_blank',
        external: true,
      })
    } else {
      links.push({
        label: 'Vendor',
        icon: 'hugeicons:link-square-02',
        to: data.value.url,
        target: '_blank',
        external: true,
      })
    }
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

// What the set is: stays true long after the group buy ends
const details = computed(() =>
  [
    { term: 'Designer', description: data.value.designer },
    { term: 'Sculpt', description: data.value.sculpt },
  ].filter((item) => item.description),
)

// When and how it was sold: secondary history for collectors
const groupBuy = computed(() => {
  const items = [
    { term: 'IC Date', description: formatDate(data.value.ic_date) },
    {
      term: 'Timeline',
      description: formatDateRange(data.value.start_date, data.value.end_date),
    },
  ].filter((item) => item.description)

  if (data.value.status) {
    items.push({
      term: 'Status',
      badge: {
        label: data.value.status,
        color: keysetStatusColors[data.value.status],
      },
    })
  }

  return items
})

const submitKitLink = computed(() => ({
  path: '/keyset/submissions/submit',
  query: { profile, keyset: data.value.profile_keyset_id },
}))

const visible = ref(false)

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
