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

          <UButton
            v-else-if="authenticated"
            label="Submit a Kit"
            icon="hugeicons:cells"
            :to="submitKitLink"
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
      <!-- Smaller cover share on wide screens; the page stays full width -->
      <div class="grid grid-cols-1 lg:grid-cols-5 2xl:grid-cols-2 gap-8">
        <!-- Left: cover image -->
        <div class="lg:col-span-3 2xl:col-span-1">
          <NuxtImg
            :src="coverImg"
            :alt="fullName"
            class="w-full aspect-video rounded-lg border border-default object-cover cursor-zoom-in"
            @click="openPreview({ title: fullName, url: coverImg })"
          />
        </div>

        <!-- Right: identity, catalog details, group buy history, links -->
        <div class="space-y-6 lg:col-span-2 2xl:col-span-1">
          <UPageHeader
            :title="fullName"
            :description="data.description"
            :ui="{
              root: 'pt-0 pb-4',
              title: 'text-2xl',
              description: 'text-sm',
            }"
          />

          <section class="space-y-3">
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

          <section v-if="externalLinks.length" class="space-y-3">
            <h2 class="text-xs uppercase tracking-widest text-muted">Links</h2>
            <UPageLinks :links="externalLinks" />
          </section>
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
            :ui="{ description: 'line-clamp-2' }"
            @click="
              openPreview({
                title: kitLabel(kit),
                url: kit.img,
                description: kit.description,
              })
            "
          >
            <div class="relative">
              <NuxtImg
                loading="lazy"
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
            Submit a kit
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
      <UModal
        v-model:open="preview.open"
        :title="preview.title"
        :description="preview.description || undefined"
        :ui="{ content: 'max-w-5xl' }"
      >
        <template #body>
          <NuxtImg
            v-if="preview.url"
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

const kitLabel = (kit) => kit.name || kit.category?.name || 'Kit'

// Prefer the keyset's own cover, then the base kit render
const coverImg = computed(
  () => data.value?.img || kits.value[0]?.img || '/keyset.png',
)

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
})

function openPreview({ title, url, description = '' }) {
  if (!url) return
  Object.assign(preview, { open: true, title, url, description })
}

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
