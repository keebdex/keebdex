<template>
  <UDashboardPanel :id="`keycap-${profile}-${keycap}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UDropdownMenu
            v-if="editable"
            :items="[
              {
                label: 'Manage Kits',
                icon: 'hugeicons:cells',
                to: `/keycap/${data.profile_keycap_id}/kit`,
              },
              {
                label: 'Manage Colors',
                icon: 'hugeicons:colors',
                to: `/keycap/${data.profile_keycap_id}/color`,
              },
            ]"
          >
            <UButton
              label="Manage"
              icon="hugeicons:dashboard-square-setting"
              trailing-icon="hugeicons:arrow-down-01"
            />
          </UDropdownMenu>

          <UModal v-if="editable" v-model:visible="visible" title="Edit Keycap">
            <UButton label="Edit" icon="hugeicons:keyboard" />

            <template #body="{ close }">
              <ModalKeycapForm
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
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHeader :title="data.name" :links="links">
        <template v-if="data.description" #description>
          <PageHeaderDescription :description="data.description" />
        </template>

        <template #links>
          <UButton
            v-for="link in links"
            :key="link.label"
            :target="link.to?.startsWith('http') ? '_blank' : undefined"
            :disabled="!link.to"
            v-bind="link"
          />
        </template>
      </UPageHeader>

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
              :title="item.name"
              :description="item.description"
              reverse
              variant="ghost"
            >
              <NuxtImg loading="lazy" :alt="item.name" :src="item.img" />
            </UPageCard>
          </UCarousel>
        </div>

        <div class="col-span-3 lg:col-span-1">
          <UAccordion v-model="activeKey" :items="items" type="multiple">
            <template #specifications>
              <DescriptionList
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
                      color: keycapStatuses[data.status],
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
                  :label="kit.name"
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
            <template #colors>
              <div class="flex flex-wrap gap-2 py-2">
                <ColorCard
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

const { profile, keycap } = route.params
const editable = computed(() => userStore.isEditable(`${profile}/${keycap}`))

const activeKey = ref(['0', '1', '2', '3'])

const { data, refresh } = await useAsyncData(
  `keycap/${profile}/${keycap}`,
  () =>
    $fetch(`/api/keycaps/${profile}/${keycap}`).then((data) => {
      data.artisans = groupBy(data.artisans, 'maker_name')
      return data
    }),
  {
    watch: [() => profile, () => keycap],
  },
)

const breadcrumbs = computed(() => {
  return [
    {
      label: manufacturers[profile],
      to: `/keycap/${profile}`,
    },
    {
      label: data.value.name,
    },
  ]
})

const links = []
if (data.value.url) {
  if (data.value.url.includes('geekhack')) {
    links.push({
      label: 'Discuss on Geekhack',
      icon: 'hugeicons:comment-01',
      to: data.value.url,
      target: '_blank',
    })
  } else {
    links.push({
      label: 'Vendor',
      icon: 'hugeicons:link-forward',
      to: data.value.url,
      target: '_blank',
    })
  }
}

if (data.value.order_graph) {
  links.push({
    label: 'Order Graph',
    icon: 'hugeicons:bar-chart-horizontal',
    to: data.value.order_graph,
    target: '_blank',
  })
}

if (data.value.order_history) {
  links.push({
    label: 'Order History',
    icon: 'hugeicons:chart-line-data-02',
    to: data.value.order_history,
    target: '_blank',
  })
}

const items = [
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

useSeoMeta({
  title: data.value
    ? `${data.value.profile.name} ${data.value.name}`
    : manufacturers[profile],
  description: data.value?.description,
  ogDescription: data.value?.description,
  twitterDescription: data.value?.description,
})

defineOgImageComponent('Keycap', {
  manufacturerId: profile,
})
</script>
