<template>
  <UDashboardPanel id="artisan-submissions">
    <template #header>
      <UDashboardNavbar title="Artisan Submissions">
        <template #right>
          <UButton
            label="Submit an Artisan"
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

        <SharedSubmissionToolbar v-model:status="statusFilter" />

        <UTable
          sticky
          :loading="status === 'pending'"
          :data="rows"
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

          <template #review_status-cell="{ row }">
            <UBadge
              :label="row.original.review_status"
              variant="subtle"
              :color="statusColorMap[row.original.review_status] || 'neutral'"
            />
          </template>

          <template #release-cell="{ row }">
            {{ row.original.release || '-' }}
          </template>

          <template #qty-cell="{ row }">
            {{ row.original.qty ?? '-' }}
          </template>

          <template #action-cell="{ row }">
            <SharedSubmissionRowActions
              :status="row.original.review_status"
              :loading="processingId === row.original.id"
              :disabled="busy"
              :can-edit="canEdit(row.original)"
              :can-delete="canDelete(row.original)"
              @approve="moderate(row.original, 'approve')"
              @reject="moderate(row.original, 'reject')"
              @edit="edit(row.original)"
              @delete="deleteTarget = row.original"
            />
          </template>
        </UTable>

        <SharedSubmissionPagination
          :meta="paginationMeta"
          :page="page"
          :size="size"
          @update:page="setPage"
        />
      </UPageCard>

      <UModal v-model:open="editorOpen" title="Edit Colorway">
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
      <SharedRejectModal
        v-model:open="rejectOpen"
        v-model:note="rejectNote"
        :title="rejectTitle"
        :description="rejectDescription"
        :confirm-label="rejectTitle"
        :loading="rejecting"
        @confirm="confirmReject"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const columns = [
  { accessorKey: 'img', header: 'Image' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'maker', header: 'Maker' },
  { accessorKey: 'sculpt', header: 'Sculpt' },
  { accessorKey: 'release', header: 'Release' },
  { accessorKey: 'qty', header: 'Qty' },
  { accessorKey: 'review_status', header: 'Status' },
  { id: 'action' },
]

const {
  isModerator,
  statusFilter,
  page,
  size,
  setPage,
  status,
  rows,
  paginationMeta,
  canEdit,
  canDelete,
  processingId,
  busy,
  moderate,
  deleteTarget,
  deleteOpen,
  deleting,
  confirmDelete,
  editorOpen,
  selectedSubmission,
  edit,
  onEditSuccess,
  onDeleteSuccess,
  rejectOpen,
  rejectNote,
  rejecting,
  rejectTitle,
  rejectDescription,
  confirmReject,
} = useSubmissionReviewQueue({
  endpoint: '/api/submissions/artisan',
  key: 'artisan-submissions',
  entity: 'Colorway',
  label: (colorway) => colorway.name,
  leafUrl: (colorway) =>
    `/api/makers/${colorway.maker_id}/sculpts/${colorway.sculpt_id}/colorways`,
  statusOf: (colorway) => colorway.review_status,
})

const pageDescription = computed(() =>
  isModerator.value
    ? 'Review colorways submitted by the community and approve, reject, or edit them before they become official records.'
    : "Track the colorways you've submitted. You can edit or delete a colorway while it's pending review or after it was rejected; editing a rejected colorway sends it back for review.",
)
</script>
