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

        <div class="flex justify-end px-4 py-3.5 border-b border-accented">
          <USelect
            v-model="resolvedFilter"
            :items="resolvedFilterOptions"
            class="w-full sm:w-52"
          />
        </div>

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
              class="font-medium truncate cursor-pointer"
              @click="toggleExpand(row.original.id)"
            >
              {{ row.original.name || 'Anonymous' }}
            </div>
          </template>

          <template #email-cell="{ row }">
            <div
              class="truncate cursor-pointer"
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
                    : 'line-clamp-1 truncate'
                "
              >
                {{ row.original.message || '-' }}
              </p>
            </div>
          </template>

          <template #action-cell="{ row }">
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                v-if="!resolvedFilter"
                :label="row.original.resolved ? 'Resolved' : 'Resolve'"
                size="xs"
                color="primary"
                icon="hugeicons:checkmark-circle-02"
                :loading="resolvingId === row.original.id"
                :disabled="row.original.resolved"
                @click="markResolved(row.original.id)"
              />

              <UButton
                v-if="!row.original.resolved"
                label="To Shoutout"
                size="xs"
                icon="hugeicons:quote-up"
                :loading="movingId === row.original.id"
                @click="moveToTestimonial(row.original)"
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

      <UModal v-model:open="editorOpen" :title="editorTitle">
        <template #body="{ close }">
          <ModalShoutoutForm
            :metadata="shoutoutDraft"
            @on-success="
              async () => {
                await completeFeedbackMove()
                close()
                editorOpen = false
                clearSelectedFeedback()
              }
            "
          />
        </template>
      </UModal>
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

const resolvedFilter = ref(false)
const resolvedFilterOptions = [
  {
    label: 'Unresolved',
    value: false,
  },
  {
    label: 'Resolved',
    value: true,
  },
]

const { page, size, setPage, resetPage } = usePagination(10)
const term = ref('')

const { data, status, refresh } = useAdvancedSearch('/api/admin/feedbacks', {
  key: 'admin-feedbacks',
  term,
  minLength: 0,
  pagination: {
    page,
    size,
  },
  filters: {
    resolved: resolvedFilter,
  },
})

const expandedId = ref(null)
const resolvingId = ref(null)
const movingId = ref(null)
const editorOpen = ref(false)
const selectedFeedback = ref(null)

const isExpanded = (id) => expandedId.value === id

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

watch(resolvedFilter, () => {
  expandedId.value = null
  resetPage()
})

const editorTitle = computed(() => 'Create Shoutout')

const shoutoutDraft = computed(() => ({
  name: selectedFeedback.value?.name || 'Anonymous',
  content: selectedFeedback.value?.message || '',
  role: '',
  avatar_url: '',
  status: 'Approved',
  featured: false,
}))

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

const clearSelectedFeedback = () => {
  selectedFeedback.value = null
}

const moveToTestimonial = async (feedback) => {
  selectedFeedback.value = feedback
  editorOpen.value = true
}

const completeFeedbackMove = async () => {
  if (!selectedFeedback.value?.id) {
    return
  }

  movingId.value = selectedFeedback.value.id

  try {
    await $fetch(`/api/admin/feedbacks/${selectedFeedback.value.id}`, {
      method: 'post',
      body: {
        resolved: true,
      },
    })

    await refresh()
  } catch (error) {
    toast.add(handleError(error))
    throw error
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
