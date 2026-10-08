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

        <div
          class="flex flex-col-reverse gap-3 px-4 py-3.5 border-b border-accented sm:flex-row sm:items-center sm:justify-between"
        >
          <UButton
            :label="allExpanded ? 'Collapse All' : 'Expand All'"
            :icon="
              allExpanded ? 'hugeicons:arrow-up-01' : 'hugeicons:arrow-down-01'
            "
            variant="ghost"
            :disabled="!groups.length"
            @click="toggleAll"
          />
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            class="w-full sm:w-52"
          />
        </div>

        <UTable
          v-model:expanded="expanded"
          :get-row-id="(group) => group.brand_keyboard_slug"
          sticky
          :loading="status === 'pending'"
          :data="groups"
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
            <div
              v-if="isModerator && pendingVariants(row.original).length"
              class="flex flex-wrap items-center gap-2"
            >
              <UButton
                label="Approve All"
                size="xs"
                color="success"
                icon="hugeicons:checkmark-circle-02"
                :loading="isBulkRunning(row.original, 'approve')"
                :disabled="busy"
                @click="bulkTarget = { group: row.original, action: 'approve' }"
              />
              <UButton
                label="Reject All"
                size="xs"
                color="error"
                icon="hugeicons:cancel-circle"
                :loading="isBulkRunning(row.original, 'reject')"
                :disabled="busy"
                @click="bulkTarget = { group: row.original, action: 'reject' }"
              />
            </div>
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
                <div class="flex flex-wrap items-center gap-2">
                  <template v-if="isModerator">
                    <UButton
                      v-if="variantRow.original.status !== 'Approved'"
                      label="Approve"
                      size="xs"
                      color="success"
                      icon="hugeicons:checkmark-circle-02"
                      :loading="processingId === variantRow.original.id"
                      :disabled="busy"
                      @click="
                        moderateSubmission(variantRow.original, 'approve')
                      "
                    />
                    <UButton
                      v-if="variantRow.original.status !== 'Rejected'"
                      label="Reject"
                      size="xs"
                      color="error"
                      icon="hugeicons:cancel-circle"
                      :loading="processingId === variantRow.original.id"
                      :disabled="busy"
                      @click="moderateSubmission(variantRow.original, 'reject')"
                    />
                  </template>
                  <UButton
                    v-if="canEdit(variantRow.original)"
                    label="Edit"
                    size="xs"
                    variant="soft"
                    icon="hugeicons:file-edit"
                    :disabled="busy"
                    @click="editSubmission(variantRow.original)"
                  />
                  <UButton
                    v-if="canDelete(variantRow.original)"
                    label="Delete"
                    size="xs"
                    color="error"
                    variant="soft"
                    icon="hugeicons:delete-02"
                    :disabled="busy"
                    @click="deleteTarget = variantRow.original"
                  />
                </div>
              </template>
            </UTable>
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
            {{ paginationMeta.total === 1 ? 'keyboard' : 'keyboards' }}
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

const userStore = useUserStore()
const toast = useToast()
const { isModerator } = storeToRefs(userStore)

const pageDescription = computed(() =>
  isModerator.value
    ? 'Review keyboards submitted by the community and approve, reject, or edit them before they become official records.'
    : "Track the keyboards you've submitted. You can edit or delete a keyboard while it's pending review or after it was rejected; editing a rejected keyboard sends it back for review.",
)

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

const statusFilter = ref('Pending')

const { page, size, setPage, resetPage } = usePagination(10)
const { data, status, refresh } = useAdvancedSearch(
  '/api/submissions/keyboard',
  {
    key: 'keyboard-submissions',
    term: ref(''),
    minLength: 0,
    pagination: { page, size },
    filters: { status: statusFilter },
  },
)

watch(statusFilter, resetPage)

// One row per keyboard; each group carries the variants matching the status
// filter.
const groups = computed(() => data.value?.data || [])

// Keyed by brand_keyboard_slug, so a group stays open across refreshes.
const expanded = ref({})
const allExpanded = computed(
  () =>
    expanded.value === true ||
    (groups.value.length > 0 &&
      groups.value.every(
        (group) => expanded.value?.[group.brand_keyboard_slug],
      )),
)

const toggleAll = () => {
  expanded.value = allExpanded.value ? {} : true
}

const paginationMeta = computed(() => {
  const total = data.value?.count || 0
  const visibleOnPage = groups.value.length

  if (!total || !visibleOnPage) return { total, from: 0, to: 0 }

  const from = (page.value - 1) * size + 1

  return { total, from, to: from + visibleOnPage - 1 }
})

const editorOpen = ref(false)
const selectedSubmission = ref(null)
const processingId = ref(null)

// Submitters can only act on variants that are still in (or back in) review.
const canEdit = (variant) =>
  isModerator.value || ['Pending', 'Rejected'].includes(variant.status)

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

const pendingVariants = (group) =>
  group.variants.filter((variant) => variant.status === 'Pending')

// The variant endpoint rewrites every field, so send the whole row back.
const postModeration = (variant, action) => {
  const { release, submitter, status: _status, ...fields } = variant

  return $fetch(`/api/keyboards/${variant.brand_keyboard_slug}/variants`, {
    method: 'post',
    body: { ...fields, action },
  })
}

const moderateSubmission = async (variant, action) => {
  if (!isModerator.value || busy.value) return

  processingId.value = variant.id

  try {
    await postModeration(variant, action)

    toast.add(handleSuccess(action, variantLabel(variant), 'Variant'))
    await refresh()
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    processingId.value = null
  }
}

// Approve/Reject all acts on a keyboard's Pending variants only. Variants are
// posted one at a time so the release/keyboard cascade sees each previous
// result (a parent is only rejected once none of its variants is left alive).
const bulkTarget = ref(null)
const bulkRunning = ref(false)
const bulkOpen = computed({
  get: () => !!bulkTarget.value,
  set: (value) => {
    if (!value && !bulkRunning.value) bulkTarget.value = null
  },
})

const busy = computed(() => processingId.value !== null || bulkRunning.value)

const isBulkRunning = (group, action) =>
  bulkRunning.value &&
  bulkTarget.value?.group.brand_keyboard_slug === group.brand_keyboard_slug &&
  bulkTarget.value?.action === action

const bulkTitle = computed(() =>
  bulkTarget.value?.action === 'approve' ? 'Approve All' : 'Reject All',
)

const bulkDescription = computed(() => {
  const group = bulkTarget.value?.group

  if (!group) return ''

  const count = pendingVariants(group).length
  const verb = bulkTarget.value.action === 'approve' ? 'approve' : 'reject'

  return `Are you sure you want to ${verb} ${count} pending ${
    count === 1 ? 'variant' : 'variants'
  } of ${groupLabel(group)}?`
})

const confirmBulk = async () => {
  const target = bulkTarget.value

  if (!target || !isModerator.value || busy.value) return

  const { group, action } = target
  const variants = pendingVariants(group)

  bulkRunning.value = true

  let done = 0
  let lastError = null

  try {
    for (const variant of variants) {
      try {
        await postModeration(variant, action)
        done++
      } catch (error) {
        lastError = error
      }
    }

    if (done) {
      toast.add(
        handleSuccess(
          action,
          `${done} ${done === 1 ? 'variant' : 'variants'} of ${groupLabel(group)}`,
        ),
      )
    }

    if (lastError) {
      toast.add(handleError(lastError, { showOriginalMessage: true }))
    }

    bulkTarget.value = null
    await refresh()
  } finally {
    bulkRunning.value = false
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

// Staff can delete anything; submitters only while it's Pending or Rejected.
const canDelete = (variant) =>
  isModerator.value || ['Pending', 'Rejected'].includes(variant.status)

const confirmDelete = async () => {
  const variant = deleteTarget.value

  if (!variant || deleting.value) return

  deleting.value = true

  try {
    await $fetch(
      `/api/keyboards/${variant.brand_keyboard_slug}/variants/${variant.id}`,
      { method: 'delete' },
    )

    toast.add(handleSuccess('delete', variantLabel(variant), 'Variant'))
    deleteTarget.value = null
    await refresh()
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    deleting.value = false
  }
}

const editSubmission = (variant) => {
  selectedSubmission.value = variant
  editorOpen.value = true
}

const closeEditor = async (close) => {
  await refresh()
  close()
  editorOpen.value = false
  selectedSubmission.value = null
}

const onEditSuccess = async (close, result) => {
  // A rejected variant that was edited is Pending again, so follow it there.
  if (result?.resubmitted) statusFilter.value = 'Pending'

  await closeEditor(close)
}

const onDeleteSuccess = (close) => closeEditor(close)
</script>
