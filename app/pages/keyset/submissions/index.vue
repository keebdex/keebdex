<template>
  <UDashboardPanel id="keyset-submissions">
    <template #header>
      <UDashboardNavbar title="Keyset Submissions">
        <template #right>
          <UButton
            label="Submit a Keyset"
            icon="hugeicons:plus-sign"
            to="/keyset/submissions/submit"
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

        <SharedSubmissionToolbar
          v-model:status="statusFilter"
          expandable
          :all-expanded="allExpanded"
          :disabled="!rows.length"
          @toggle-all="toggleAll"
        />

        <UTable
          v-model:expanded="expanded"
          :get-row-id="(group) => group.profile_keyset_id"
          sticky
          :loading="status === 'pending'"
          :data="rows"
          :columns="groupColumns"
          :ui="{ tr: 'data-[expanded=true]:bg-elevated/50' }"
          class="min-w-0 max-w-full"
        >
          <template #expand-cell="{ row }">
            <UButton
              variant="ghost"
              size="sm"
              :icon="
                row.getIsExpanded()
                  ? 'hugeicons:arrow-down-01'
                  : 'hugeicons:arrow-right-01'
              "
              :aria-label="row.getIsExpanded() ? 'Collapse' : 'Expand'"
              @click="row.toggleExpanded()"
            />
          </template>

          <template #img-cell="{ row }">
            <NuxtImg
              v-if="row.original.keyset?.img"
              :src="row.original.keyset.img"
              :alt="row.original.keyset?.name"
              class="size-12 rounded object-cover"
            />
          </template>

          <template #keyset-cell="{ row }">
            <UButton
              :label="groupLabel(row.original)"
              variant="link"
              class="p-0 font-medium text-highlighted"
              :ui="{ label: 'truncate max-w-64' }"
              @click="row.toggleExpanded()"
            />
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="row.original.keyset?.review_status || 'Published'"
              variant="subtle"
              :color="
                statusColorMap[row.original.keyset?.review_status] || 'neutral'
              "
            />
          </template>

          <template #kits-cell="{ row }">
            {{ row.original.kits.length }}
          </template>

          <template #action-cell="{ row }">
            <SharedSubmissionBulkActions
              :moderatable="
                isModerator && pendingLeaves(row.original).length > 0
              "
              :deletable="rejectedLeaves(row.original).length > 0"
              :running="bulkActionFor(row.original)"
              :disabled="busy"
              @approve="bulkTarget = { group: row.original, action: 'approve' }"
              @reject="bulkTarget = { group: row.original, action: 'reject' }"
              @delete="bulkTarget = { group: row.original, action: 'delete' }"
            />
          </template>

          <template #expanded="{ row }">
            <UTable
              :data="row.original.kits"
              :columns="kitColumns"
              :ui="{
                root: 'rounded-md border border-default bg-default',
                th: 'py-2',
              }"
              class="min-w-0 max-w-full"
            >
              <template #img-cell="{ row: kitRow }">
                <NuxtImg
                  v-if="kitRow.original.img || kitRow.original.keyset?.img"
                  :src="kitRow.original.img || kitRow.original.keyset?.img"
                  :alt="kitName(kitRow.original)"
                  class="size-10 rounded object-cover"
                />
              </template>

              <template #kit-cell="{ row: kitRow }">
                <div class="font-medium truncate max-w-48">
                  {{ kitName(kitRow.original) }}
                </div>
              </template>

              <template #price-cell="{ row: kitRow }">
                {{ kitRow.original.price ?? '-' }}
              </template>

              <template #qty-cell="{ row: kitRow }">
                {{ kitRow.original.qty ?? '-' }}
              </template>

              <template #submitter-cell="{ row: kitRow }">
                <span class="truncate max-w-40 block">
                  {{
                    kitRow.original.submitter?.full_name ||
                    kitRow.original.submitter?.email ||
                    '-'
                  }}
                </span>
              </template>

              <template #status-cell="{ row: kitRow }">
                <UBadge
                  :label="kitRow.original.status"
                  variant="subtle"
                  :color="statusColorMap[kitRow.original.status] || 'neutral'"
                />
              </template>

              <template #action-cell="{ row: kitRow }">
                <SharedSubmissionRowActions
                  :status="kitRow.original.status"
                  :loading="processingId === kitRow.original.id"
                  :disabled="busy"
                  :can-edit="canEdit(kitRow.original)"
                  :can-delete="canDelete(kitRow.original)"
                  @approve="moderate(kitRow.original, 'approve')"
                  @reject="moderate(kitRow.original, 'reject')"
                  @edit="edit(kitRow.original)"
                  @delete="deleteTarget = kitRow.original"
                />
              </template>
            </UTable>
          </template>
        </UTable>

        <SharedSubmissionPagination
          :meta="paginationMeta"
          :page="page"
          :size="size"
          :nouns="['keyset', 'keysets']"
          @update:page="setPage"
        />
      </UPageCard>

      <UModal v-model:open="editorOpen" title="Edit Kit">
        <template #body="{ close }">
          <KeysetModalSubmissionWizard
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
        title="Delete Kit"
        :description="`Are you sure you want to delete ${kitLabel(deleteTarget || {})}? This action cannot be undone.`"
        :loading="deleting"
        @confirm="confirmDelete"
      />

      <SharedConfirmModal
        v-model:open="bulkOpen"
        :title="bulkTitle"
        :description="bulkDescription"
        :confirm-label="bulkTitle"
        :confirm-color="bulkTarget?.action === 'approve' ? 'success' : 'error'"
        :loading="bulkRunning"
        @confirm="confirmBulk"
      />
      <SharedNoteModal
        v-model:open="rejectOpen"
        v-model:note="rejectNote"
        :title="rejectTitle"
        :description="rejectDescription"
        :confirm-label="rejectTitle"
        confirm-color="error"
        label="Note to submitter"
        placeholder="e.g. The photo shows a different colorway."
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

const groupColumns = [
  { id: 'expand' },
  { id: 'img', header: 'Image' },
  { id: 'keyset', header: 'Keyset' },
  { id: 'kits', header: 'Kits' },
  { id: 'status', header: 'Status' },
  { id: 'action' },
]

const kitColumns = [
  { accessorKey: 'img', header: 'Image' },
  { accessorKey: 'kit', header: 'Kit' },
  { accessorKey: 'price', header: 'Price' },
  { accessorKey: 'qty', header: 'Qty' },
  { accessorKey: 'submitter', header: 'Submitter' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'action' },
]

const kitName = (kit) => kit.name || kit.category?.name || kit.kit_id

const kitLabel = (kit) =>
  [kit.keyset?.name, kitName(kit)].filter(Boolean).join(' - ')

// e.g. "GMK Olivia"; falls back to the composite id when the keyset is missing.
const groupLabel = (group) =>
  group?.keyset?.name
    ? [group.keyset.profile?.name || group.keyset.profile_id, group.keyset.name]
        .filter(Boolean)
        .join(' ')
    : group?.profile_keyset_id

// One row per keyset; each group carries the kits matching the status filter.
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
  expanded,
  allExpanded,
  toggleAll,
  pendingLeaves,
  rejectedLeaves,
  bulkTarget,
  bulkOpen,
  bulkRunning,
  bulkActionFor,
  bulkTitle,
  bulkDescription,
  confirmBulk,
  rejectOpen,
  rejectNote,
  rejecting,
  rejectTitle,
  rejectDescription,
  confirmReject,
} = useSubmissionReviewQueue({
  endpoint: '/api/submissions/keyset',
  key: 'keyset-submissions',
  entity: 'Kit',
  label: kitLabel,
  leafUrl: (kit) => `/api/keysets/${kit.profile_keyset_id}/kits`,
  grouping: {
    idKey: 'profile_keyset_id',
    leavesKey: 'kits',
    label: groupLabel,
    nouns: ['kit', 'kits'],
  },
})

const pageDescription = computed(() =>
  isModerator.value
    ? 'Review keysets submitted by the community and approve, reject, or edit them before they become official records.'
    : "Track the keysets you've submitted. You can edit or delete a keyset while it's pending review or after it was rejected; editing a rejected keyset sends it back for review.",
)
</script>
