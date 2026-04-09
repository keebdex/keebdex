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

          <SharedProfileDrawer
            :title="data.name"
            :description="data.description"
          />

          <UDropdownMenu v-if="items.length" :items="items">
            <UButton label="More" trailing-icon="hugeicons:arrow-down-01" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="data.kits.length" class="grid grid-cols-3 gap-6">
        <div class="col-span-3 lg:col-span-2">
          <UCarousel
            ref="carousel"
            v-slot="{ item }"
            :items="data.kits"
            loop
            dots
            :autoplay="{ delay: 3000 }"
            class="max-w-7xl mx-auto"
          >
            <UPageCard
              :title="item.name || item.category?.name"
              :description="item.description"
              reverse
              variant="ghost"
            >
              <NuxtImg loading="lazy" :alt="item.name" :src="item.img" />
            </UPageCard>
          </UCarousel>
        </div>

        <div class="col-span-3 lg:col-span-1">
          <UAccordion v-model="activeKey" :items="accordions" type="multiple">
            <template #specifications>
              <SharedDescriptionList
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
              />
            </template>

            <template #kits>
              <div class="flex flex-wrap gap-2 py-2">
                <UButton
                  v-for="(kit, idx) in data.kits"
                  :key="kit.id"
                  :label="kit.name || kit.category?.name"
                  @click="onSelectKit(idx)"
                >
                  <template v-if="kit.cancelled" #leading>
                    <UTooltip text="Cancelled">
                      <UIcon name="hugeicons:unavailable" class="text-error" />
                    </UTooltip>
                  </template>
                </UButton>
              </div>
            </template>

            <template v-if="data.colors?.length" #colors>
              <div class="flex flex-wrap gap-2 py-2">
                <KeysetColorCard
                  v-for="color in data.colors"
                  :key="color.id"
                  v-bind="color.color"
                />
              </div>
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
      label: manufacturers[profile],
      to: `/keyset/${profile}`,
    },
    {
      label: data.value.name,
    },
  ]
})

const items = computed(() => {
  const manageItems = editable.value
    ? [
        {
          label: 'Manage',
          type: 'label',
        },
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
    : []

  const infoItems = []

  if (data.value.url) {
    if (data.value.url.includes('geekhack')) {
      infoItems.push({
        label: 'Geekhack',
        icon: 'hugeicons:comment-01',
        to: data.value.url,
        target: '_blank',
      })
    } else {
      infoItems.push({
        label: 'Vendor',
        icon: 'hugeicons:link-forward',
        to: data.value.url,
        target: '_blank',
      })
    }
  }

  if (data.value.order_graph) {
    infoItems.push({
      label: 'Order Graph',
      icon: 'hugeicons:chart-bar-big',
      to: data.value.order_graph,
      target: '_blank',
    })
  }

  if (data.value.order_history) {
    infoItems.push({
      label: 'Order History',
      icon: 'hugeicons:chart-line-data-02',
      to: data.value.order_history,
      target: '_blank',
    })
  }

  if (infoItems.length) {
    return [
      ...manageItems,
      {
        label: 'Information',
        type: 'label',
      },
      ...infoItems,
    ]
  }

  return manageItems
})

const accordions = [
  {
    label: 'Specifications',
    icon: 'hugeicons:information-circle',
    slot: 'specifications',
  },
  {
    label: 'Kits',
    icon: 'hugeicons:cells',
    slot: 'kits',
  },
  {
    label: 'Colors',
    icon: 'hugeicons:colors',
    slot: 'colors',
    content: 'No color codes have been added yet. Check back soon!',
  },
  {
    label: 'Disclaimers',
    icon: 'hugeicons:justice-scale-01',
    content:
      'Kindly note that the images are of 3D renders and are for illustration purposes only. The final colors may differ slightly.',
  },
]

const visible = ref(false)

const activeIndex = ref(0)
const carousel = useTemplateRef('carousel')

const onSelectKit = (index) => {
  activeIndex.value = index
  carousel.value.emblaApi.scrollTo(index)
}

const meta = computed(() => {
  return {
    title: data.value
      ? `${data.value.profile.name} ${data.value.name}`
      : manufacturers[profile],
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
