<template>
  <UDashboardPanel :id="`keycap-${profile}-${keycap}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UButton
            label="Manage Kits"
            icon="hugeicons:dashboard-square-02"
            :to="`/keycap/${data.profile_keycap_id}/kit`"
          />

          <UModal v-if="editable" v-model:visible="visible" title="Edit Keycap">
            <UButton label="Edit" icon="hugeicons:keyboard" />

            <template #body>
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
            v-slot="{ item }"
            :items="data.kits"
            loop
            dots
            :autoplay="{ delay: 2000 }"
            class="w-full mx-auto"
          >
            <div class="mb-4">
              <div class="relative mx-auto">
                <img :src="item.img" :alt="item.name" class="w-full rounded" />
              </div>
            </div>

            <div class="flex justify-between items-center">
              <div class="mt-0 font-semibold">
                {{ item.name }}
              </div>
              <div v-if="item.price" class="mt-0 font-semibold">
                ${{ item.price }}
              </div>
            </div>
            <div class="mt-4">
              {{ item.description }}
            </div>
          </UCarousel>
        </div>

        <div class="col-span-3 lg:col-span-1">
          <UAccordion v-model="activeKey" :items="items" type="multiple">
            <template #specifications>
              <!-- <ul class="list-none p-0 m-0 flex flex-col gap-2 py-2 text-sm">
                <li v-if="data.designer">Designer: {{ data.designer }}</li>
                <li v-if="data.sculpt">Sculpt: {{ data.sculpt }}</li>
                <li v-if="data.status === 'Interest Check'">
                  IC Date: {{ formatDate(data.ic_date) }}
                </li>
                <li v-else>
                  Timeline:
                  {{ formatDateRange(data.start_date, data.end_date) }}
                </li>
                <li v-if="data.status">
                  Status:
                  <UBadge
                    :label="data.status"
                    :color="keycapStatuses[data.status]"
                  />
                </li>
              </ul> -->
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
                  v-for="kit in data.kits"
                  :key="kit.id"
                  :label="kit.name"
                  size="sm"
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

const activeKey = ref(['0', '1', '2'])

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
  links.push({
    label: 'Thread',
    icon: 'hugeicons:globe-02',
    to: data.value.url,
    target: '_blank',
  })
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
    icon: 'hugeicons:dashboard-square-02',
    slot: 'kits',
  },
  {
    label: 'Disclaimers',
    icon: 'hugeicons:justice-scale-01',
    content:
      'Kindly note that the images are of 3D renders and are for illustration purposes only. The final colors may differ slightly.',
  },
]

const visible = ref(false)

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
