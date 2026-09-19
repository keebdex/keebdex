<template>
  <SharedRedirectPage v-if="!isModerator" to="/artisan/maker" />

  <UDashboardPanel v-else id="artisan-colorway-submissions">
    <template #header>
      <UDashboardNavbar title="Colorway Submissions" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="space-y-4 mx-auto w-full lg:max-w-6xl">
        <template #header>
          Review colorways submitted by the community and approve, reject, or
          edit them before they become official records.
        </template>

        <div class="flex justify-end px-4 py-3.5 border-b border-accented">
          <USelect
            v-model="statusFilter"
            :items="statusFilterOptions"
            class="w-full sm:w-52"
          />
        </div>

        <UTable
          sticky
          :loading="status === 'pending'"
          :data="data.data"
          :columns="columns"
        >
          <template #img-cell="{ row }">
            <NuxtImg
              v-if="row.original.img"
              :src="row.original.img"
              :alt="row.original.name"
              class="size-12 rounded object-cover"
            />
          </template>

          <template #name-cell="{ row }">
            <div class="font-medium truncate max-w-48">
              {{ row.original.name }}
            </div>
          </template>

          <template #maker-cell="{ row }">
            <div class="truncate max-w-48">
              {{ row.original.maker?.name || row.original.maker_id }} /
              {{ row.original.sculpt?.name || row.original.sculpt_id }}
            </div>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="row.original.status"
              variant="subtle"
              :color="statusColorMap[row.original.status] || 'neutral'"
            />
          </template>

          <template #created_at-cell="{ row }">
            {{ formatDate(row.original.created_at) }}
          </template>

          <template #action-cell="{ row }">
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                v-if="row.original.status !== 'Approved'"
                label="Approve"
                size="xs"
                color="success"
                icon="hugeicons:checkmark-circle-02"
                :loading="processingId === row.original.id"
                @click="approve(row.original)"
              />

              <UButton
                v-if="row.original.status !== 'Rejected'"
                label="Reject"
                size="xs"
                color="error"
                icon="hugeicons:cancel-circle"
                :loading="processingId === row.original.id"
                @click="reject(row.original)"
              />

              <UButton
                label="Edit & Approve"
                size="xs"
                variant="soft"
                icon="hugeicons:file-edit"
                @click="editAndApprove(row.original)"
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

      <UModal v-model:open="editorOpen" title="Edit & Approve Colorway">
        <template #body="{ close }">
          <ArtisanModalColorwayForm
            v-if="selectedSubmission"
            :metadata="selectedSubmission"
            :moderator="true"
            @on-success="
              async () => {
                await approve(selectedSubmission)
                close()
                editorOpen = false
                selectedSubmission = null
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
const { isModerator } = storeToRefs(userStore)
const toast = useToast()

const columns = [
  { accessorKey: 'img', header: 'Image' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'maker', header: 'Maker / Sculpt' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Submitted' },
  { id: 'action' },
]

const statusFilter = ref('Pending')
const statusFilterOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
]

const statusColorMap = {
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'error',
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const { page, size, setPage, resetPage } = usePagination(10)

const { data, status, refresh } = useAdvancedSearch(
  '/api/artisan/colorway-submissions',
  {
    key: 'artisan-colorway-submissions',
    term: ref(''),
    minLength: 0,
    pagination: {
      page,
      size,
    },
    filters: {
      status: statusFilter,
    },
  },
)

watch(statusFilter, resetPage)

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

const processingId = ref(null)
const editorOpen = ref(false)
const selectedSubmission = ref(null)

const approve = async (colorway) => {
  processingId.value = colorway.id

  try {
    await $fetch(`/api/artisan/colorway-submissions/${colorway.id}`, {
      method: 'post',
      body: { action: 'approve' },
    })

    toast.add(handleSuccess('save', colorway.name, 'Colorway'))
    await refresh()
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    processingId.value = null
  }
}

const reject = async (colorway) => {
  processingId.value = colorway.id

  try {
    await $fetch(`/api/artisan/colorway-submissions/${colorway.id}`, {
      method: 'post',
      body: { action: 'reject' },
    })

    toast.add(handleSuccess('save', colorway.name, 'Colorway'))
    await refresh()
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    processingId.value = null
  }
}

const editAndApprove = (colorway) => {
  selectedSubmission.value = colorway
  editorOpen.value = true
}
</script>
