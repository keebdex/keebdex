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
          :get-row-id="(group) => group.profile_keyset_id"
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
            <div
              v-if="isModerator && pendingKits(row.original).length"
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
                <div class="flex flex-wrap items-center gap-2">
                  <template v-if="isModerator">
                    <UButton
                      v-if="kitRow.original.status !== 'Approved'"
                      label="Approve"
                      size="xs"
                      color="success"
                      icon="hugeicons:checkmark-circle-02"
                      :loading="processingId === kitRow.original.id"
                      :disabled="busy"
                      @click="moderateSubmission(kitRow.original, 'approve')"
                    />
                    <UButton
                      v-if="kitRow.original.status !== 'Rejected'"
                      label="Reject"
                      size="xs"
                      color="error"
                      icon="hugeicons:cancel-circle"
                      :loading="processingId === kitRow.original.id"
                      :disabled="busy"
                      @click="moderateSubmission(kitRow.original, 'reject')"
                    />
                  </template>
                  <UButton
                    v-if="canEdit(kitRow.original)"
                    label="Edit"
                    size="xs"
                    variant="soft"
                    icon="hugeicons:file-edit"
                    :disabled="busy"
                    @click="editSubmission(kitRow.original)"
                  />
                  <UButton
                    v-if="canDelete(kitRow.original)"
                    label="Delete"
                    size="xs"
                    color="error"
                    variant="soft"
                    icon="hugeicons:delete-02"
                    :disabled="busy"
                    @click="deleteTarget = kitRow.original"
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
            {{ paginationMeta.total === 1 ? 'keyset' : 'keysets' }}
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
    ? 'Review keysets submitted by the community and approve, reject, or edit them before they become official records.'
    : "Track the keysets you've submitted. You can edit or delete a keyset while it's pending review or after it was rejected; editing a rejected keyset sends it back for review.",
)

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

const statusFilter = ref('Pending')

const { page, size, setPage, resetPage } = usePagination(10)
const { data, status, refresh } = useAdvancedSearch('/api/submissions/keyset', {
  key: 'keyset-submissions',
  term: ref(''),
  minLength: 0,
  pagination: { page, size },
  filters: { status: statusFilter },
})

watch(statusFilter, resetPage)

// One row per keyset; each group carries the kits matching the status filter.
const groups = computed(() => data.value?.data || [])

// Keyed by profile_keyset_id, so a group stays open across refreshes.
const expanded = ref({})
const allExpanded = computed(
  () =>
    expanded.value === true ||
    (groups.value.length > 0 &&
      groups.value.every((group) => expanded.value?.[group.profile_keyset_id])),
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

// Submitters can only act on kits that are still in (or back in) review.
const canEdit = (kit) =>
  isModerator.value || ['Pending', 'Rejected'].includes(kit.status)

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

const pendingKits = (group) =>
  group.kits.filter((kit) => kit.status === 'Pending')

const moderateSubmission = async (kit, action) => {
  if (!isModerator.value || busy.value) return

  processingId.value = kit.id

  try {
    await $fetch(`/api/keysets/${kit.profile_keyset_id}/kits`, {
      method: 'post',
      body: { id: kit.id, action },
    })

    toast.add(handleSuccess(action, kitLabel(kit), 'Kit'))
    await refresh()
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    processingId.value = null
  }
}

// Approve/Reject all acts on a keyset's Pending kits only. Kits are posted one
// at a time so the keyset cascade sees each previous result (a keyset is only
// rejected once none of its kits is left alive).
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
  bulkTarget.value?.group.profile_keyset_id === group.profile_keyset_id &&
  bulkTarget.value?.action === action

const bulkTitle = computed(() =>
  bulkTarget.value?.action === 'approve' ? 'Approve All' : 'Reject All',
)

const bulkDescription = computed(() => {
  const group = bulkTarget.value?.group

  if (!group) return ''

  const count = pendingKits(group).length
  const verb = bulkTarget.value.action === 'approve' ? 'approve' : 'reject'

  return `Are you sure you want to ${verb} ${count} pending ${
    count === 1 ? 'kit' : 'kits'
  } of ${groupLabel(group)}?`
})

const confirmBulk = async () => {
  const target = bulkTarget.value

  if (!target || !isModerator.value || busy.value) return

  const { group, action } = target
  const kits = pendingKits(group)

  bulkRunning.value = true

  let done = 0
  let lastError = null

  try {
    for (const kit of kits) {
      try {
        await $fetch(`/api/keysets/${kit.profile_keyset_id}/kits`, {
          method: 'post',
          body: { id: kit.id, action },
        })
        done++
      } catch (error) {
        lastError = error
      }
    }

    if (done) {
      toast.add(
        handleSuccess(
          action,
          `${done} ${done === 1 ? 'kit' : 'kits'} of ${groupLabel(group)}`,
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
const canDelete = (kit) =>
  isModerator.value || ['Pending', 'Rejected'].includes(kit.status)

const confirmDelete = async () => {
  const kit = deleteTarget.value

  if (!kit || deleting.value) return

  deleting.value = true

  try {
    await $fetch(`/api/keysets/${kit.profile_keyset_id}/kits/${kit.id}`, {
      method: 'delete',
    })

    toast.add(handleSuccess('delete', kitLabel(kit), 'Kit'))
    deleteTarget.value = null
    await refresh()
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    deleting.value = false
  }
}

const editSubmission = (kit) => {
  selectedSubmission.value = kit
  editorOpen.value = true
}

const closeEditor = async (close) => {
  await refresh()
  close()
  editorOpen.value = false
  selectedSubmission.value = null
}

const onEditSuccess = async (close, result) => {
  // A rejected kit that was edited is Pending again, so follow it there.
  if (result?.resubmitted) statusFilter.value = 'Pending'

  await closeEditor(close)
}

const onDeleteSuccess = (close) => closeEditor(close)
</script>
