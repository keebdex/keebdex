<template>
  <UDashboardPanel id="artisan-submissions">
    <template #header>
      <UDashboardNavbar title="Colorway Submissions">
        <template #right>
          <UButton
            label="Submit a Colorway"
            icon="hugeicons:plus-sign"
            to="/artisan/submissions/submit"
          />
        </template>
      </UDashboardNavbar>
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
            {{ row.original.maker?.name || row.original.maker_id }}
          </template>

          <template #sculpt-cell="{ row }">
            {{ row.original.sculpt?.name || row.original.sculpt_id }}
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="row.original.status"
              variant="subtle"
              :color="statusColorMap[row.original.status] || 'neutral'"
            />
          </template>

          <template #release-cell="{ row }">
            {{ row.original.release || '-' }}
          </template>

          <template #qty-cell="{ row }">
            {{ row.original.qty ?? '-' }}
          </template>

          <!-- <template #created_at-cell="{ row }">
            {{ formatDate(row.original.created_at) }}
          </template> -->

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
                  :disabled="processingId !== null"
                  @click="moderateSubmission(row.original, 'approve')"
                />
                <UButton
                  v-if="row.original.status !== 'Rejected'"
                  label="Reject"
                  size="xs"
                  color="error"
                  icon="hugeicons:cancel-circle"
                  :loading="processingId === row.original.id"
                  :disabled="processingId !== null"
                  @click="moderateSubmission(row.original, 'reject')"
                />
              </template>
              <UButton
                v-if="canEdit(row.original)"
                label="Edit"
                size="xs"
                variant="soft"
                icon="hugeicons:file-edit"
                :disabled="processingId !== null"
                @click="editSubmission(row.original)"
              />
              <UButton
                v-if="canDelete(row.original)"
                label="Delete"
                size="xs"
                color="error"
                variant="soft"
                icon="hugeicons:delete-02"
                :disabled="processingId !== null"
                @click="deleteTarget = row.original"
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
              list: 'flex-wrap justify-center sm:justify-end',
            }"
            @update:page="setPage"
          />
        </div>
      </UPageCard>

      <UModal v-model:open="editorOpen" :title="editorTitle">
        <template #body="{ close }">
          <ArtisanModalSubmissionWizard
            v-if="selectedSubmission"
            mode="review"
            :submission="selectedSubmission"
            @on-success="(result) => onEditSuccess(close, result)"
            @on-delete="() => onDeleteSuccess(close)"
          />
        </template>
      </UModal>

      <SharedConfirmModal
        v-model:open="deleteOpen"
        title="Delete Colorway"
        :description="`Are you sure you want to delete ${deleteTarget?.name || 'this colorway'}? This action cannot be undone.`"
        :loading="deleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const userStore = useUserStore()
const toast = useToast()
const { isModerator } = storeToRefs(userStore)

const pageDescription = computed(() =>
  isModerator.value
    ? 'Review colorways submitted by the community and approve, reject, or edit them before they become official records.'
    : "Track the colorways you've submitted. You can edit or delete a colorway while it's pending review or after it was rejected; editing a rejected colorway sends it back for review.",
)

const columns = [
  { accessorKey: 'img', header: 'Image' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'maker', header: 'Maker' },
  { accessorKey: 'sculpt', header: 'Sculpt' },
  { accessorKey: 'release', header: 'Release' },
  { accessorKey: 'qty', header: 'Qty' },
  { accessorKey: 'status', header: 'Status' },
  // { accessorKey: 'created_at', header: 'Submitted' },
  { id: 'action' },
]

const statusFilter = ref('Pending')

// const formatDate = (value) => {
//   if (!value) return '-'
//   return new Date(value).toLocaleDateString()
// }

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

const editorOpen = ref(false)
const selectedSubmission = ref(null)
const processingId = ref(null)

const editorTitle = 'Edit Colorway'

// Submitters can only act on colorways that are still in (or back in) review.
const canEdit = (colorway) =>
  isModerator.value || ['Pending', 'Rejected'].includes(colorway.status)

const canDelete = canEdit

const colorwayUrl = (colorway) =>
  `/api/makers/${colorway.maker_id}/sculpts/${colorway.sculpt_id}/colorways`

const moderateSubmission = async (colorway, action) => {
  if (!isModerator.value || processingId.value !== null) return

  processingId.value = colorway.id

  try {
    await $fetch(colorwayUrl(colorway), {
      method: 'post',
      body: { id: colorway.id, action },
    })

    toast.add(handleSuccess(action, colorway.name, 'Colorway'))
    await refresh()
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    processingId.value = null
  }
}

const deleteTarget = ref(null)
const deleting = ref(false)
const deleteOpen = computed({
  get: () => !!deleteTarget.value,
  set: (value) => {
    if (!value && !deleting.value) deleteTarget.value = null
  },
})

const confirmDelete = async () => {
  const colorway = deleteTarget.value

  if (!colorway || deleting.value) return

  deleting.value = true

  try {
    await $fetch(`${colorwayUrl(colorway)}/${colorway.id}`, {
      method: 'delete',
    })

    toast.add(handleSuccess('delete', colorway.name, 'Colorway'))
    deleteTarget.value = null
    await refresh()
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    deleting.value = false
  }
}

const editSubmission = (colorway) => {
  selectedSubmission.value = colorway
  editorOpen.value = true
}

const closeEditor = async (close) => {
  await refresh()
  close()
  editorOpen.value = false
  selectedSubmission.value = null
}

const onEditSuccess = async (close, result) => {
  // A rejected colorway that was edited is Pending again, so follow it there.
  if (result?.resubmitted) statusFilter.value = 'Pending'

  await closeEditor(close)
}

const onDeleteSuccess = (close) => closeEditor(close)
</script>
