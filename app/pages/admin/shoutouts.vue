<template>
  <SharedRedirectPage v-if="!isAdmin" to="/account/settings" />

  <UDashboardPanel v-else id="admin-shoutouts">
    <template #header>
      <UDashboardNavbar title="Shoutouts Management" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="space-y-4 mx-auto w-full lg:max-w-6xl">
        <template #header>
          Manage all testimonials and choose which ones are featured on the
          homepage.
        </template>

        <div class="flex justify-end px-4 py-3.5 border-b border-accented">
          <USelect
            v-model="featuredFilter"
            :items="featuredFilterOptions"
            class="w-full sm:w-52"
          />
        </div>

        <UTable
          sticky
          :loading="status === 'pending'"
          :data="data.data"
          :columns="columns"
        >
          <template #id-cell="{ row }"> #{{ row.original.id }} </template>

          <template #content-cell="{ row }">
            <div class="max-w-xl">
              <p class="line-clamp-2 text-sm">{{ row.original.content }}</p>
            </div>
          </template>

          <template #featured-cell="{ row }">
            <UBadge
              :label="row.original.featured ? 'Featured' : 'Hidden'"
              :color="row.original.featured ? 'success' : 'neutral'"
              variant="subtle"
            />
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="row.original.status"
              :color="statusColorMap[row.original.status] || 'neutral'"
              variant="subtle"
            />
          </template>

          <template #action-cell="{ row }">
            <UButton
              :label="row.original.featured ? 'Unfeature' : 'Feature'"
              size="xs"
              icon="hugeicons:star"
              :loading="updatingId === row.original.id"
              @click="toggleFeatured(row.original)"
            />
          </template>
        </UTable>

        <div
          class="border-t border-default pt-4 mt-auto px-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-toned text-sm text-center sm:text-left">
            Showing {{ paginationMeta.from }} to {{ paginationMeta.to }} of
            <span class="font-semibold text-highlighted">{{
              paginationMeta.total
            }}</span>
          </p>

          <UPagination
            v-if="data.count > size"
            :page="page"
            :items-per-page="size"
            :total="data.count"
            :ui="{
              list: 'justify-center sm:justify-end',
            }"
            @update:page="setPage"
          />
        </div>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const userStore = useUserStore()
const { isAdmin } = storeToRefs(userStore)
const toast = useToast()

const columns = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    accessorKey: 'content',
    header: 'Content',
  },
  {
    accessorKey: 'featured',
    header: 'Visibility',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'action',
  },
]

const featuredFilter = ref('all')
const featuredFilterOptions = [
  {
    label: 'All Visibility',
    value: 'all',
  },
  {
    label: 'Featured Only',
    value: 'featured',
  },
  {
    label: 'Hidden Only',
    value: 'hidden',
  },
]

const statusColorMap = {
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'error',
}

const { page, size, setPage, resetPage } = usePagination(10)
const term = ref('')

const { data, status, refresh } = useAdvancedSearch('/api/admin/testimonials', {
  key: 'admin-shoutouts',
  term,
  minLength: 0,
  pagination: {
    page,
    size,
  },
  filters: {
    featured: featuredFilter,
  },
})

const updatingId = ref(null)

watch(featuredFilter, resetPage)

const paginationMeta = computed(() => {
  const total = data.value?.count || 0
  const visibleOnPage = data.value?.data?.length || 0

  if (!total || !visibleOnPage) {
    return {
      total,
      from: 0,
      to: 0,
    }
  }

  const from = (page.value - 1) * size + 1
  const to = from + visibleOnPage - 1

  return {
    total,
    from,
    to,
  }
})

const toggleFeatured = async (testimonial) => {
  updatingId.value = testimonial.id

  try {
    await $fetch(`/api/admin/testimonials/${testimonial.id}`, {
      method: 'post',
      body: {
        featured: !testimonial.featured,
      },
    })

    toast.add(handleSuccess('save', 'Shoutout visibility'))
    await refresh()
  } catch (error) {
    toast.add(handleError(error))
  } finally {
    updatingId.value = null
  }
}

useSeoMeta({
  title: 'Shoutouts Management',
})

definePageMeta({
  middleware: 'admin',
})
</script>
