<template>
  <UDashboardPanel id="artisan-submissions">
    <template #header>
      <UDashboardNavbar title="Colorway Submissions" />
    </template>

    <template #body>
      <UPageCard
        variant="subtle"
        class="space-y-4 mx-auto min-w-0 w-full lg:max-w-6xl"
        :ui="{ container: 'min-w-0', wrapper: 'min-w-0' }"
      >
        <template #header>
          {{ pageDescription }}
        </template>

        <div class="flex justify-end px-4 py-3.5 border-b border-accented">
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            class="w-full sm:w-52"
          />
        </div>

        <UTable
          v-if="hasSubmissions || isModerator"
          sticky
          :loading="status === 'pending'"
          :data="data.data"
          :columns="columns"
          class="min-w-0 max-w-full"
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
              <template v-if="isModerator">
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
                  @click="editSubmission(row.original)"
                />

                <UButton
                  v-if="row.original.status !== 'Approved'"
                  label="Delete"
                  size="xs"
                  color="error"
                  variant="soft"
                  icon="hugeicons:delete-02"
                  :loading="processingId === row.original.id"
                  @click="confirmDelete(row.original)"
                />
              </template>

              <template v-else>
                <UButton
                  v-if="row.original.status === 'Pending'"
                  label="Edit"
                  size="xs"
                  variant="soft"
                  icon="hugeicons:file-edit"
                  @click="editSubmission(row.original)"
                />

                <UButton
                  v-if="row.original.status !== 'Approved'"
                  label="Delete"
                  size="xs"
                  color="error"
                  icon="hugeicons:delete-02"
                  :loading="processingId === row.original.id"
                  @click="confirmDelete(row.original)"
                />
              </template>
            </div>
          </template>
        </UTable>

        <div
          v-if="hasSubmissions || isModerator"
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
              list: 'flex-wrap justify-center sm:justify-end',
            }"
            @update:page="setPage"
          />
        </div>

        <div
          v-else
          class="flex flex-col items-center gap-3 py-12 px-4 text-center"
        >
          <UPageSection
            icon="hugeicons:paint-board"
            title="No Colorway Submissions Yet"
            description="You haven't submitted any colorways. Start contributing by browsing makers and submitting a colorway from a sculpt page."
            :links="[
              {
                label: 'Browse Makers',
                to: '/artisan/maker',
                icon: 'hugeicons:user-multiple',
                variant: 'soft',
              },
            ]"
            :ui="{
              title: 'text-base! text-toned',
              description: 'text-sm!',
            }"
          />
        </div>
      </UPageCard>

      <UModal v-model:open="editorOpen" :title="editorTitle">
        <template #body="{ close }">
          <ArtisanModalColorwayForm
            v-if="selectedSubmission"
            :metadata="selectedSubmission"
            :moderator="isModerator"
            @on-success="() => onEditSuccess(close)"
          />
        </template>
      </UModal>

      <UModal
        v-model:open="deleteVisible"
        title="Delete Submission"
        :description="`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`"
      >
        <template #footer="{ close }">
          <UButton
            label="Cancel"
            @click="
              () => {
                close()
                deleteTarget = null
              }
            "
          />
          <UButton
            label="Delete"
            color="error"
            :loading="processingId === deleteTarget?.id"
            @click="deleteSubmission(close)"
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const userStore = useUserStore()
const { isModerator } = storeToRefs(userStore)
const toast = useToast()

const pageDescription = computed(() =>
  isModerator.value
    ? 'Review colorways submitted by the community and approve, reject, or edit them before they become official records.'
    : "Track the colorways you've submitted. You can edit or delete a submission while it's pending review, and delete a rejected submission.",
)

const columns = [
  { accessorKey: 'img', header: 'Image' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'maker', header: 'Maker / Sculpt' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Submitted' },
  { id: 'action' },
]

const statusFilter = ref('Pending')

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const { page, size, setPage, resetPage } = usePagination(10)
const { data, status, refresh } = useAdvancedSearch(
  '/api/submissions/artisan',
  {
    key: 'artisan-submissions',
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

const hasSubmissions = computed(() => (data.value?.data?.length || 0) > 0)

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

const editorTitle = computed(() =>
  isModerator.value ? 'Edit & Approve Colorway' : 'Edit Colorway',
)

const approve = async (colorway) => {
  processingId.value = colorway.id

  try {
    await $fetch(`/api/submissions/artisan/${colorway.id}`, {
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
    await $fetch(`/api/submissions/artisan/${colorway.id}`, {
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

const editSubmission = (colorway) => {
  selectedSubmission.value = colorway
  editorOpen.value = true
}

const onEditSuccess = async (close) => {
  if (isModerator.value) {
    await approve(selectedSubmission.value)
  } else {
    await refresh()
  }

  close()
  editorOpen.value = false
  selectedSubmission.value = null
}

const deleteTarget = ref(null)
const deleteVisible = ref(false)

const confirmDelete = (colorway) => {
  deleteTarget.value = colorway
  deleteVisible.value = true
}

const deleteSubmission = async (close) => {
  if (!deleteTarget.value) return

  processingId.value = deleteTarget.value.id

  try {
    await $fetch(
      `/api/makers/${deleteTarget.value.maker_id}/sculpts/${deleteTarget.value.sculpt_id}/colorways/${deleteTarget.value.id}`,
      { method: 'delete' },
    )

    toast.add(handleSuccess('delete', deleteTarget.value.name))
    close()
    deleteVisible.value = false
    deleteTarget.value = null
    await refresh()
  } catch (error) {
    toast.add(handleError(error))
  } finally {
    processingId.value = null
  }
}
</script>
