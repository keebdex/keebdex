<template>
  <SharedRedirectPage v-if="!isAdmin" to="/account/settings" />

  <UDashboardPanel v-else id="admin-feedbacks">
    <template #header>
      <UDashboardNavbar title="Feedback Management" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="space-y-4 mx-auto w-full lg:max-w-6xl">
        <template #header>
          Review community feedback, resolve entries, and promote worthy
          messages to shoutouts.
        </template>

        <UTable
          sticky
          :loading="status === 'pending'"
          :data="data.data"
          :columns="columns"
        >
          <template #id-cell="{ row }">
            <div class="cursor-pointer" @click="toggleExpand(row.original.id)">
              #{{ row.original.id }}
            </div>
          </template>

          <template #name-cell="{ row }">
            <div
              class="font-medium truncate max-w-36 cursor-pointer"
              @click="toggleExpand(row.original.id)"
            >
              {{ row.original.name || 'Anonymous' }}
            </div>
          </template>

          <template #email-cell="{ row }">
            <div
              class="truncate max-w-44 cursor-pointer"
              @click="toggleExpand(row.original.id)"
            >
              {{ row.original.email || '-' }}
            </div>
          </template>

          <template #message-cell="{ row }">
            <div
              class="cursor-pointer max-w-xl"
              @click="toggleExpand(row.original.id)"
            >
              <p
                class="text-sm"
                :class="
                  isExpanded(row.original.id)
                    ? 'whitespace-pre-wrap'
                    : 'line-clamp-2'
                "
              >
                {{ row.original.message || '-' }}
              </p>
            </div>
          </template>

          <template #action-cell="{ row }">
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                :label="row.original.resolved ? 'Resolved' : 'Resolve'"
                size="xs"
                color="primary"
                icon="hugeicons:checkmark-circle-02"
                :loading="resolvingId === row.original.id"
                :disabled="row.original.resolved"
                @click="markResolved(row.original.id)"
              />

              <UButton
                label="To Shoutout"
                size="xs"
                color="neutral"
                variant="outline"
                icon="hugeicons:quote-up-circle"
                :loading="movingId === row.original.id"
                @click="moveToTestimonial(row.original.id)"
              />
            </div>
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
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'message',
    header: 'Message',
  },
  {
    id: 'action',
  },
]

const { page, size, setPage } = usePagination(10)
const term = ref('')

const { data, status, refresh } = useAdvancedSearch('/api/admin/feedbacks', {
  key: 'admin-feedbacks',
  term,
  minLength: 0,
  pagination: {
    page,
    size,
  },
})

const expandedId = ref(null)
const resolvingId = ref(null)
const movingId = ref(null)

const isExpanded = (id) => expandedId.value === id

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

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

const markResolved = async (id) => {
  resolvingId.value = id

  try {
    await $fetch(`/api/admin/feedbacks/${id}`, {
      method: 'post',
      body: {
        resolved: true,
      },
    })

    toast.add(handleSuccess('save', 'Feedback status'))
    await refresh()
  } catch (error) {
    toast.add(handleError(error))
  } finally {
    resolvingId.value = null
  }
}

const moveToTestimonial = async (id) => {
  movingId.value = id

  try {
    await $fetch(`/api/admin/feedbacks/${id}/to-testimonial`, {
      method: 'post',
    })

    toast.add(handleSuccess('save', 'Shoutout'))
    await refresh()
  } catch (error) {
    toast.add(handleError(error))
  } finally {
    movingId.value = null
  }
}

useSeoMeta({
  title: 'Feedback Management',
})

definePageMeta({
  middleware: 'admin',
})
</script>
