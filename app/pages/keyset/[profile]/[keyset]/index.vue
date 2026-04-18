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

          <UDropdownMenu v-if="manageItems.length" :items="manageItems">
            <UButton label="Manage" trailing-icon="hugeicons:arrow-down-01" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHeader v-if="data.description" :description="data.description" />

      <div v-if="data.kits.length" class="grid grid-cols-3 gap-8">
        <!-- Left: image carousel + thumbnail strip -->
        <div class="col-span-3 lg:col-span-2 space-y-4 max-w-7xl mx-auto">
          <UCarousel
            ref="carousel"
            v-slot="{ item }"
            :items="data.kits"
            loop
            :autoplay="{ delay: 3000 }"
            @select="onSelectKit"
          >
            <UPageCard
              :title="
                activeKit.description
                  ? activeKit.name || activeKit.category?.name
                  : undefined
              "
              :description="activeKit.description"
              reverse
              variant="naked"
              :ui="{
                wrapper: 'items-center text-center',
                title: 'text-muted italic',
                description: 'text-sm',
              }"
            >
              <NuxtImg
                loading="lazy"
                :alt="item.name"
                :src="item.img"
                class="w-full"
              />
            </UPageCard>
          </UCarousel>

          <UPageGrid
            class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-6 3xl:sm:grid-cols-8 gap-2 pt-2"
          >
            <UButton
              v-for="(kit, idx) in data.kits"
              :key="kit.id"
              class="relative rounded overflow-hidden ring-2 transition-all !p-0"
              :class="
                activeIndex === idx
                  ? 'ring-primary opacity-100'
                  : 'ring-transparent opacity-60 hover:opacity-90'
              "
              variant="naked"
              @click="onSelectKit(idx)"
            >
              <NuxtImg
                loading="lazy"
                :src="kit.img"
                :alt="kit.name || kit.category?.name"
                class="w-full aspect-video object-cover"
              />
              <div
                class="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-[10px] text-white text-center truncate leading-tight"
              >
                {{ kit.name || kit.category?.name }}
              </div>
              <div
                v-if="kit.cancelled"
                class="absolute inset-0 bg-error/20 flex items-center justify-center"
              >
                <UIcon
                  name="hugeicons:unavailable"
                  class="text-error h-8 w-8"
                />
              </div>
            </UButton>
          </UPageGrid>
        </div>

        <!-- Right: specs + colors + references -->
        <div class="col-span-3 lg:col-span-1 space-y-6">
          <UAccordion
            v-model="activeKey"
            :items="accordions"
            type="multiple"
            :ui="{
              label: 'uppercase tracking-widest text-muted',
            }"
          >
            <template #specifications>
              <SharedDescriptionList
                :columns="1"
                orientation="horizontal"
                :items="[
                  { term: 'Designer', description: data.designer },
                  { term: 'Sculpt', description: data.sculpt },
                  { term: 'IC Date', description: formatDate(data.ic_date) },
                  {
                    term: 'Timeline',
                    description: formatDateRange(
                      data.start_date,
                      data.end_date,
                    ),
                  },
                  {
                    term: 'Status',
                    badge: {
                      label: data.status,
                      color: keysetStatusColors[data.status],
                    },
                  },
                ]"
                class="mb-2"
              />
            </template>

            <template v-if="data.colors?.length" #colors>
              <UPageGrid
                class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-3 gap-4 mb-2"
              >
                <KeysetColorCard
                  v-for="color in data.colors"
                  :key="color.id"
                  v-bind="color.color"
                />
              </UPageGrid>
            </template>

            <template v-if="externalLinks.length" #links>
              <UPageLinks :links="externalLinks" />
            </template>
          </UAccordion>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import groupBy from 'lodash.groupby'

const route = useRoute()
const userStore = useUserStore()
const { manufacturers } = useKeysetProfiles()

const { profile, keyset } = route.params
const editable = computed(() => userStore.isEditable(`${profile}/${keyset}`))

const activeKey = ref(['0', '1', '2', '3'])

const { data, refresh } = await useAsyncData(
  `keyset/${profile}/${keyset}`,
  () =>
    $fetch(`/api/keysets/${profile}/${keyset}`).then((data) => {
      data.artisans = groupBy(data.artisans, 'maker_name')
      return data
    }),
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

const manageItems = computed(() => {
  if (!editable.value) return []
  return [
    {
      label: 'Manage Kits',
      icon: 'hugeicons:cells',
      to: `/keyset/${data.value.profile_keyset_id}/kit`,
    },
    {
      label: 'Manage Colors',
      icon: 'hugeicons:colors',
      to: `/keyset/${data.value.profile_keyset_id}/color`,
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
      to: data.value.order_graph,
      target: '_blank',
      external: true,
    })
  }

  if (data.value.order_history) {
    links.push({
      label: 'Order History',
      icon: 'hugeicons:chart-line-data-02',
      to: data.value.order_history,
      target: '_blank',
      external: true,
    })
  }

  return links
})

const accordions = [
  {
    label: 'Specifications',
    // icon: 'hugeicons:information-circle',
    slot: 'specifications',
  },
  {
    label: 'Color Palette',
    // icon: 'hugeicons:colors',
    slot: 'colors',
    content: 'No color codes have been added yet. Check back soon!',
  },
  {
    label: 'Links',
    // icon: 'hugeicons:link-square-02',
    slot: 'links',
  },
]

const visible = ref(false)

const activeIndex = ref(0)
const carousel = useTemplateRef('carousel')
const activeKit = computed(() => data.value?.kits?.[activeIndex.value])

function onSelectKit(index) {
  activeIndex.value = index
  carousel.value?.emblaApi?.scrollTo(index)
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
