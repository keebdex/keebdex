<template>
  <UDashboardPanel id="keyboard-submissions">
    <template #header>
      <UDashboardNavbar title="Keyboard Submissions">
        <template #right>
          <UButton
            label="Submit a Keyboard"
            icon="hugeicons:plus-sign"
            to="/keyboard/submissions/submit"
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
          :get-row-id="(group) => group.brand_keyboard_slug"
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

          <template #keyboard-cell="{ row }">
            <UButton
              :label="groupLabel(row.original)"
              variant="link"
              class="p-0 font-medium text-highlighted"
              :ui="{ label: 'truncate max-w-64' }"
              @click="row.toggleExpanded()"
            />
          </template>

          <template #form_factor-cell="{ row }">
            {{ row.original.keyboard?.form_factor || '-' }}
          </template>

          <template #releases-cell="{ row }">
            {{ releaseCount(row.original) }}
          </template>

          <template #variants-cell="{ row }">
            {{ row.original.variants.length }}
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="row.original.keyboard?.review_status || 'Published'"
              variant="subtle"
              :color="
                statusColorMap[row.original.keyboard?.review_status] ||
                'neutral'
              "
            />
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
              :data="row.original.variants"
              :columns="variantColumns"
              :ui="{
                root: 'rounded-md border border-default bg-default',
                th: 'py-2',
              }"
              class="min-w-0 max-w-full"
            >
              <template #img-cell="{ row: variantRow }">
                <NuxtImg
                  v-if="
                    variantRow.original.img_front ||
                    variantRow.original.img_back
                  "
                  :src="
                    variantRow.original.img_front ||
                    variantRow.original.img_back
                  "
                  :alt="variantRow.original.variant_name"
                  class="size-10 rounded object-cover"
                />
              </template>

              <template #release-cell="{ row: variantRow }">
                <span class="truncate max-w-40 block">
                  {{ variantRow.original.release?.name || '-' }}
                </span>
              </template>

              <template #variant-cell="{ row: variantRow }">
                <div class="font-medium truncate max-w-48">
                  {{ variantRow.original.variant_name }}
                </div>
              </template>

              <template #price-cell="{ row: variantRow }">
                {{
                  variantRow.original.msrp_price
                    ? `${variantRow.original.currency || ''} ${variantRow.original.msrp_price}`.trim()
                    : '-'
                }}
              </template>

              <template #submitter-cell="{ row: variantRow }">
                <span class="truncate max-w-40 block">
                  {{
                    variantRow.original.submitter?.full_name ||
                    variantRow.original.submitter?.email ||
                    '-'
                  }}
                </span>
              </template>

              <template #status-cell="{ row: variantRow }">
                <UBadge
                  :label="variantRow.original.status"
                  variant="subtle"
                  :color="
                    statusColorMap[variantRow.original.status] || 'neutral'
                  "
                />
              </template>

              <template #action-cell="{ row: variantRow }">
                <SharedSubmissionRowActions
                  :status="variantRow.original.status"
                  :loading="processingId === variantRow.original.id"
                  :disabled="busy"
                  :can-edit="canEdit(variantRow.original)"
                  :can-delete="canDelete(variantRow.original)"
                  @approve="moderate(variantRow.original, 'approve')"
                  @reject="moderate(variantRow.original, 'reject')"
                  @edit="edit(variantRow.original)"
                  @delete="deleteTarget = variantRow.original"
                />
              </template>
            </UTable>
          </template>
        </UTable>

        <SharedSubmissionPagination
          :meta="paginationMeta"
          :page="page"
          :size="size"
          :nouns="['keyboard', 'keyboards']"
          @update:page="setPage"
        />
      </UPageCard>

      <UModal v-model:open="editorOpen" title="Edit Variant">
        <template #body="{ close }">
          <KeyboardModalSubmissionWizard
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
        title="Delete Variant"
        :description="`Are you sure you want to delete ${variantLabel(deleteTarget || {})}? This action cannot be undone.`"
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
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const groupColumns = [
  { id: 'expand' },
  { id: 'keyboard', header: 'Keyboard' },
  { id: 'form_factor', header: 'Form Factor' },
  { id: 'releases', header: 'Releases' },
  { id: 'variants', header: 'Variants' },
  { id: 'status', header: 'Status' },
  { id: 'action' },
]

const variantColumns = [
  { accessorKey: 'img', header: 'Image' },
  { accessorKey: 'release', header: 'Release' },
  { accessorKey: 'variant', header: 'Variant' },
  { accessorKey: 'price', header: 'Price' },
  { accessorKey: 'submitter', header: 'Submitter' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'action' },
]

const variantLabel = (variant) =>
  [variant.release?.keyboard?.name, variant.release?.name, variant.variant_name]
    .filter(Boolean)
    .join(' - ')

// e.g. "Wuque Studio Zoom65"; falls back to the slug when the keyboard is
// missing.
const groupLabel = (group) =>
  group?.keyboard?.name
    ? [
        group.keyboard.brand?.name || group.keyboard.brand_slug,
        group.keyboard.name,
      ]
        .filter(Boolean)
        .join(' ')
    : group?.brand_keyboard_slug

// Releases that have at least one variant in this group.
const releaseCount = (group) =>
  new Set(group.variants.map((variant) => variant.release_id)).size

// One row per keyboard; each group carries the variants matching the status
// filter.
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
} = useSubmissionReviewQueue({
  endpoint: '/api/submissions/keyboard',
  key: 'keyboard-submissions',
  entity: 'Variant',
  label: variantLabel,
  leafUrl: (variant) =>
    `/api/keyboards/${variant.brand_keyboard_slug}/variants`,
  grouping: {
    idKey: 'brand_keyboard_slug',
    leavesKey: 'variants',
    label: groupLabel,
    nouns: ['variant', 'variants'],
  },
})

const pageDescription = computed(() =>
  isModerator.value
    ? 'Review keyboards submitted by the community and approve, reject, or edit them before they become official records.'
    : "Track the keyboards you've submitted. You can edit or delete a keyboard while it's pending review or after it was rejected; editing a rejected keyboard sends it back for review.",
)
</script>
