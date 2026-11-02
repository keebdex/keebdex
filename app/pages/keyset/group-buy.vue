<template>
  <UDashboardPanel id="keyset-group-buys">
    <template #header>
      <UDashboardNavbar title="Group Buys" />

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageHeader
        headline="Keysets"
        :title="tab.title"
        :description="tab.description"
        :ui="listingPageHeaderUi"
      >
        <template v-if="isAdmin" #links>
          <UModal v-model:open="adding" title="Add Keyset">
            <UButton color="primary" icon="hugeicons:keyboard" label="Add Keyset" />

            <template #body="{ close }">
              <KeysetModalKeysetForm
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
      </UPageHeader>

      <section class="pt-4">
        <KeysetGrid
          :keysets="data?.keysets"
          :total="data?.count"
          :page="page"
          :size="size"
          :countdown="status === 'live'"
          @update:page="setPage"
        >
          <template #empty>
            <UEmpty
              :icon="tab.icon"
              :title="status === 'live' ? 'Nothing Live Right Now' : 'No Interest Checks Open'"
              :description="
                status === 'live'
                  ? 'No group buy is running today. Check the interest checks for what is coming next.'
                  : 'No set is gathering interest right now. Check back soon.'
              "
              :actions="
                status === 'live'
                  ? [
                      {
                        label: 'Interest Checks',
                        icon: groupBuyTabs.ic.icon,
                        to: { path: route.path, query: { status: 'ic' } },
                        ui: { label: 'block' },
                      },
                    ]
                  : undefined
              "
            />
          </template>
        </KeysetGrid>
      </section>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const validStatuses = Object.keys(groupBuyTabs)

const status = computed(() => {
  const s = route.query.status
  return validStatuses.includes(s) ? s : 'live'
})

const tab = computed(() => groupBuyTabs[status.value])

const links = computed(() =>
  Object.entries(groupBuyTabs).map(([value, meta]) => ({
    label: meta.label,
    icon: meta.icon,
    to: { path: route.path, query: { status: value } },
    active: status.value === value,
  })),
)

// redirect invalid or missing → live
if (!validStatuses.includes(route.query.status)) {
  router.replace({ query: { ...route.query, status: status.value } })
}

const { isAdmin } = storeToRefs(useUserStore())
const adding = ref(false)

const { page, size, setPage } = usePagination(36)

const { data, refresh } = await useAsyncData(
  route.path,
  () =>
    $fetch('/api/keysets', {
      query: { page: page.value, size, status: status.value },
    }),
  {
    watch: [page, status],
  },
)

const description = computed(() => tab.value?.description)

useSeoMeta({
  title: computed(() => tab.value?.title),
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
