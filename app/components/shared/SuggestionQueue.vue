<template>
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
      <template #owner-cell="{ row }">
        <span class="block max-w-40 truncate">
          {{ row.original.names?.owner }}
        </span>
      </template>

      <template #record-cell="{ row }">
        <ULink
          v-if="row.original.record"
          :to="recordPath(row.original)"
          class="block max-w-64 font-medium truncate text-highlighted hover:text-primary"
        >
          {{ recordTitle(row.original) }}
        </ULink>
        <span v-else class="block max-w-64 font-medium truncate text-muted">
          Deleted record
        </span>
      </template>

      <template #item-cell="{ row }">
        <span class="block max-w-48 truncate">
          {{ row.original.names?.item }}
        </span>
      </template>

      <template #changes-cell="{ row }">
        <div class="flex flex-wrap gap-1 max-w-72">
          <UBadge
            v-for="fieldLabel in changedLabels(row.original)"
            :key="fieldLabel"
            :label="fieldLabel"
            variant="subtle"
            size="sm"
          />
        </div>
      </template>

      <template #created_at-cell="{ row }">
        <span class="text-sm text-muted whitespace-nowrap">
          {{ formatDate(row.original.created_at) }}
        </span>
      </template>

      <template #review_status-cell="{ row }">
        <UBadge
          :label="row.original.review_status"
          variant="subtle"
          :color="statusColorMap[row.original.review_status] || 'neutral'"
        />
      </template>

      <template #action-cell="{ row }">
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            :label="canReview(row.original) ? 'Review' : 'View'"
            size="xs"
            variant="soft"
            :icon="
              canReview(row.original) ? 'hugeicons:file-edit' : 'hugeicons:view'
            "
            :disabled="busy"
            @click="selected = row.original"
          />
          <UButton
            v-if="canDelete(row.original)"
            :label="isOwn(row.original) && !canReview(row.original) ? 'Withdraw' : 'Delete'"
            size="xs"
            color="error"
            variant="soft"
            icon="hugeicons:delete-02"
            :disabled="busy"
            @click="deleteTarget = row.original"
          />
        </div>
      </template>
    </UTable>

    <SharedSubmissionPagination
      :meta="paginationMeta"
      :page="page"
      :size="size"
      :nouns="['suggestion', 'suggestions']"
      @update:page="setPage"
    />
  </UPageCard>

  <SharedSuggestionReviewModal
    v-model:open="reviewOpen"
    :suggestion="selected"
    :approving="approving"
    @approve="approve"
    @reject="(suggestion) => (rejectTarget = suggestion)"
    @open="(suggestion) => (selected = suggestion)"
  />

  <SharedNoteModal
    v-model:open="rejectOpen"
    v-model:note="rejectNote"
    title="Reject Suggestion"
    :description="
      rejectTarget
        ? `Tell the submitter why the changes to ${label(rejectTarget)} are rejected.`
        : undefined
    "
    confirm-label="Reject Suggestion"
    confirm-color="error"
    label="Note to submitter"
    :presets="SUGGESTION_REJECT_NOTES"
    placeholder="e.g. The current price matches the vendor page."
    :loading="rejecting"
    @confirm="confirmReject"
  />

  <SharedConfirmModal
    v-model:open="deleteOpen"
    :title="deleteTitle"
    :confirm-label="deleteTitle"
    :description="`Are you sure you want to ${deleteTitle.toLowerCase()} the suggested changes to ${deleteTarget ? label(deleteTarget) : 'this record'}? This action cannot be undone.`"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import { reviewNoteSchema } from '~/utils/schemas/common'
import type { SuggestionEntityType } from '~/utils/suggestions'

// Edits tab of a submission review page: edit suggestions to published
// records of one domain. Staff review them (approve all or some fields,
// possibly adjusted, or reject with a note) and delete them; submitters
// follow their own and withdraw them while Pending.
const props = defineProps<{ domain: KeebModule }>()

type Suggestion = Record<string, any>

const toast = useToast()
const userStore = useUserStore()
const { isModerator, user } = storeToRefs(userStore)

// Name columns per module, named like the New tab's: the colorway title (or
// the sculpt) next to its maker, the keyset and its kit, or the keyboard
// (with its release) between its brand and variant. A suggestion to the page
// itself leaves Kit / Variant empty.
const NAME_COLUMNS: Record<KeebModule, { id: string; header: string }[]> = {
  artisan: [
    { id: 'record', header: 'Name' },
    { id: 'owner', header: 'Maker' },
  ],
  keyboard: [
    { id: 'owner', header: 'Brand' },
    { id: 'record', header: 'Keyboard' },
    { id: 'item', header: 'Variant' },
  ],
  keyset: [
    { id: 'record', header: 'Keyset' },
    { id: 'item', header: 'Kit' },
  ],
}

const columns = [
  ...NAME_COLUMNS[props.domain],
  { id: 'changes', header: 'Changes' },
  { accessorKey: 'created_at', header: 'Suggested' },
  { accessorKey: 'review_status', header: 'Status' },
  { id: 'action' },
]

const statusFilter = ref('Pending')

const { page, size, setPage, resetPage } = usePagination(10)
const {
  data,
  status,
  refresh: refreshRows,
} = useAdvancedSearch('/api/suggestions', {
  key: `${props.domain}-suggestions`,
  term: ref(''),
  minLength: 0,
  pagination: { page, size },
  filters: { status: statusFilter, domain: props.domain },
})

const { load: refreshPendingReviews } = usePendingReviews()

// After every change: the rows, and the sidebar's pending count.
const refresh = () => Promise.all([refreshRows(), refreshPendingReviews()])

watch(statusFilter, resetPage)

const rows = computed<Suggestion[]>(() => data.value?.data || [])

const paginationMeta = computed(() => {
  const total = data.value?.count || 0
  const visibleOnPage = rows.value.length

  if (!total || !visibleOnPage) return { total, from: 0, to: 0 }

  const from = (page.value - 1) * size + 1

  return { total, from, to: from + visibleOnPage - 1 }
})

const pageDescription = computed(() =>
  isModerator.value
    ? 'Review changes the community suggests to published records. Pick the fields to apply, adjust them if needed, and approve, or reject them with a note.'
    : "Track the changes you've suggested to published records. You can update a pending suggestion from the record's page, or withdraw it here.",
)

// `DMG Unikorn` (colorway and sculpt, like colorwayTitle), `GMK Olivia`,
// `Mode Sonnet · R2`.
const recordTitle = (suggestion: Suggestion) => {
  const { owner, page, release, item } = suggestion.names || {}

  const title =
    props.domain === 'artisan'
      ? [item, page]
      : props.domain === 'keyset'
        ? [owner, page]
        : [page, release]

  return (
    title.filter(Boolean).join(props.domain === 'keyboard' ? ' · ' : ' ') ||
    suggestion.entity_name ||
    'Untitled'
  )
}

const label = (suggestion: Suggestion) =>
  suggestion.entity_name ? `"${suggestion.entity_name}"` : 'this record'

const recordPath = (suggestion: Suggestion) =>
  suggestionRecordPath(
    suggestion.entity_type as SuggestionEntityType,
    suggestion.parent_key,
    suggestion.record || {},
  )

const changedLabels = (suggestion: Suggestion) =>
  Object.keys(
    suggestion.review_status === 'Approved' && suggestion.applied
      ? suggestion.applied
      : suggestion.changes || {},
  ).map(suggestionFieldLabel)

const isOwn = (suggestion: Suggestion) =>
  suggestion.submitted_by === user.value?.uid

const canReview = (suggestion: Suggestion) =>
  suggestion.review_status === 'Pending' &&
  userStore.isEditable(suggestion.scope)

const canDelete = (suggestion: Suggestion) =>
  userStore.isEditable(suggestion.scope) ||
  (isOwn(suggestion) && suggestion.review_status === 'Pending')

// Review modal
const selected = ref<Suggestion | null>(null)
const reviewOpen = computed({
  get: () => !!selected.value,
  set: (value) => {
    if (!value && !approving.value) selected.value = null
  },
})

const approving = ref(false)

const approve = async (
  suggestion: Suggestion,
  changes: Record<string, unknown>,
) => {
  if (approving.value) return

  approving.value = true

  try {
    await $fetch(`/api/suggestions/${suggestion.id}`, {
      method: 'post',
      body: { action: 'approve', changes },
    })

    toast.add(
      successToast('approve', {
        entity: 'Suggestion',
        name: suggestion.entity_name,
      }),
    )
    selected.value = null
    await refresh()
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    approving.value = false
  }
}

// Reject: from the review modal, with a note
const rejectTarget = ref<Suggestion | null>(null)
const rejectNote = ref('')
const rejecting = ref(false)

const rejectOpen = computed({
  get: () => !!rejectTarget.value,
  set: (value) => {
    if (!value && !rejecting.value) rejectTarget.value = null
  },
})

watch(rejectTarget, () => {
  rejectNote.value = ''
})

const confirmReject = async () => {
  const suggestion = rejectTarget.value

  if (!suggestion || rejecting.value) return

  const result = reviewNoteSchema.safeParse(rejectNote.value)

  if (!result.success) {
    toast.add(validationToast(result.error.issues[0]?.message))
    return
  }

  rejecting.value = true

  try {
    await $fetch(`/api/suggestions/${suggestion.id}`, {
      method: 'post',
      body: { action: 'reject', note: result.data },
    })

    toast.add(
      successToast('reject', {
        entity: 'Suggestion',
        name: suggestion.entity_name,
      }),
    )
    rejectTarget.value = null
    selected.value = null
    await refresh()
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    rejecting.value = false
  }
}

// Delete (staff) or withdraw (submitter)
const deleteTarget = ref<Suggestion | null>(null)
const deleting = ref(false)

const deleteOpen = computed({
  get: () => !!deleteTarget.value,
  set: (value) => {
    if (!value && !deleting.value) deleteTarget.value = null
  },
})

const deleteTitle = computed(() =>
  deleteTarget.value &&
  isOwn(deleteTarget.value) &&
  !canReview(deleteTarget.value)
    ? 'Withdraw'
    : 'Delete',
)

const confirmDelete = async () => {
  const suggestion = deleteTarget.value

  if (!suggestion || deleting.value) return

  deleting.value = true

  try {
    await $fetch(`/api/suggestions/${suggestion.id}`, { method: 'delete' })

    toast.add(
      successToast('delete', {
        entity: 'Suggestion',
        name: suggestion.entity_name,
      }),
    )
    deleteTarget.value = null
    await refresh()
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    deleting.value = false
  }
}

const busy = computed(
  () => approving.value || rejecting.value || deleting.value,
)
</script>
