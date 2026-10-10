import { deletionNoteSchema, reviewNoteSchema } from '~/utils/schemas/common'

type Leaf = Record<string, any>
type Group = Record<string, any>
type ModerationAction = 'approve' | 'reject'
type BulkAction = ModerationAction | 'delete'

/**
 * State and actions of a submission review page (`/{domain}/submissions`):
 * status filter, pagination, per-leaf Approve/Reject/Edit/Delete, the review
 * wizard modal, and, for grouped queues (keysets, keyboards), expandable
 * groups with Approve All / Reject All on their Pending leaves and Delete All
 * on their Rejected ones. Reject (one leaf or all) asks for a note, which the
 * submitter reads in the notification sent by the database trigger.
 *
 * Leaves are saved through `leafUrl(leaf)` (POST, with `action` to moderate)
 * and deleted through `${leafUrl(leaf)}/${leaf.id}`.
 */
export const useSubmissionReviewQueue = ({
  endpoint,
  key,
  entity,
  label,
  leafUrl,
  statusOf = (leaf) => leaf.status,
  grouping,
}: {
  endpoint: string
  key: string
  // e.g. 'Kit', for toasts.
  entity: string
  label: (leaf: Leaf) => string
  leafUrl: (leaf: Leaf) => string
  statusOf?: (leaf: Leaf) => string | null
  grouping?: {
    idKey: string
    leavesKey: string
    label: (group: Group) => string
    // Singular and plural leaf noun, e.g. ['kit', 'kits'].
    nouns: [string, string]
  }
}) => {
  const toast = useToast()
  const { isModerator, user } = storeToRefs(useUserStore())

  const statusFilter = ref('Pending')

  const { page, size, setPage, resetPage } = usePagination(10)
  const { data, status, refresh } = useAdvancedSearch(endpoint, {
    key,
    term: ref(''),
    minLength: 0,
    pagination: { page, size },
    filters: { status: statusFilter },
  })

  watch(statusFilter, resetPage)

  // Leaves, or groups of leaves for grouped queues.
  const rows = computed<any[]>(() => data.value?.data || [])

  const paginationMeta = computed(() => {
    const total = data.value?.count || 0
    const visibleOnPage = rows.value.length

    if (!total || !visibleOnPage) return { total, from: 0, to: 0 }

    const from = (page.value - 1) * size + 1

    return { total, from, to: from + visibleOnPage - 1 }
  })

  // Staff can act on anything; submitters only on leaves that are still in
  // (or back in) review.
  const canManage = (leaf: Leaf) =>
    isModerator.value || ['Pending', 'Rejected'].includes(statusOf(leaf) || '')

  const postModeration = (
    leaf: Leaf,
    action: ModerationAction,
    note?: string,
  ) =>
    $fetch(leafUrl(leaf), {
      method: 'post',
      body: { id: leaf.id, action, note },
    })

  const processingId = ref<number | null>(null)
  const bulkRunning = ref(false)
  const busy = computed(() => processingId.value !== null || bulkRunning.value)

  // Leaf waiting for a reject note, and the note shared by single and bulk
  // rejects.
  const rejectTarget = ref<Leaf | null>(null)
  const rejectNote = ref('')

  const moderate = async (
    leaf: Leaf,
    action: ModerationAction,
    note?: string,
  ) => {
    if (!isModerator.value || busy.value) return

    // Rejecting asks for a note first; confirmReject() comes back here.
    if (action === 'reject' && note === undefined) {
      rejectNote.value = ''
      rejectTarget.value = leaf
      return
    }

    processingId.value = leaf.id

    try {
      await postModeration(leaf, action, note)

      toast.add(successToast(action, { entity, name: label(leaf) }))
      rejectTarget.value = null
      await refresh()
    } catch (error) {
      toast.add(errorToast(error, { showOriginalMessage: true }))
    } finally {
      processingId.value = null
    }
  }

  const deleteTarget = ref<Leaf | null>(null)
  const deleting = ref(false)
  const deleteOpen = computed({
    get: () => !!deleteTarget.value,
    set: (value) => {
      if (!value && !deleting.value) deleteTarget.value = null
    },
  })

  // Staff deleting someone else's proposal can tell them why; the submitter
  // is notified either way (notify_submission_deleted).
  const deleteNote = ref('')
  const deleteAsksReason = computed(
    () =>
      isModerator.value &&
      !!deleteTarget.value?.submitted_by &&
      deleteTarget.value.submitted_by !== user.value?.uid,
  )

  watch(deleteTarget, () => {
    deleteNote.value = ''
  })

  const confirmDelete = async () => {
    const leaf = deleteTarget.value

    if (!leaf || deleting.value) return

    let note: string | undefined

    if (deleteAsksReason.value && deleteNote.value.trim()) {
      const result = deletionNoteSchema.safeParse(deleteNote.value)

      if (!result.success) {
        toast.add(validationToast(result.error.issues[0]?.message))
        return
      }

      note = result.data
    }

    deleting.value = true

    try {
      await $fetch(`${leafUrl(leaf)}/${leaf.id}`, {
        method: 'delete',
        body: note ? { note } : undefined,
      })

      toast.add(successToast('delete', { entity, name: label(leaf) }))
      deleteTarget.value = null
      await refresh()
    } catch (error) {
      toast.add(errorToast(error, { showOriginalMessage: true }))
    } finally {
      deleting.value = false
    }
  }

  const editorOpen = ref(false)
  const selectedSubmission = ref<Leaf | null>(null)

  const edit = (leaf: Leaf) => {
    selectedSubmission.value = leaf
    editorOpen.value = true
  }

  const closeEditor = async (close: () => void) => {
    await refresh()
    close()
    editorOpen.value = false
    selectedSubmission.value = null
  }

  const onEditSuccess = async (
    close: () => void,
    result?: { resubmitted?: boolean },
  ) => {
    // A rejected submission that was edited is Pending again, so follow it.
    if (result?.resubmitted) statusFilter.value = 'Pending'

    await closeEditor(close)
  }

  const onDeleteSuccess = (close: () => void) => closeEditor(close)

  // Grouped queues: groups are keyed by `grouping.idKey`, so an expanded
  // group stays open across refreshes.
  const expanded = ref<Record<string, boolean> | true>({})
  const allExpanded = computed(
    () =>
      expanded.value === true ||
      (rows.value.length > 0 &&
        rows.value.every(
          (group) =>
            (expanded.value as Record<string, boolean>)[group[grouping!.idKey]],
        )),
  )

  const toggleAll = () => {
    expanded.value = allExpanded.value ? {} : true
  }

  const pendingLeaves = (group: Group): Leaf[] =>
    (group[grouping!.leavesKey] || []).filter(
      (leaf: Leaf) => statusOf(leaf) === 'Pending',
    )

  // Rejected leaves the current user may delete (all of them for staff, the
  // submitter's own otherwise).
  const rejectedLeaves = (group: Group): Leaf[] =>
    (group[grouping!.leavesKey] || []).filter(
      (leaf: Leaf) => statusOf(leaf) === 'Rejected' && canManage(leaf),
    )

  const bulkLeaves = (group: Group, action: BulkAction) =>
    action === 'delete' ? rejectedLeaves(group) : pendingLeaves(group)

  // Approve/Reject All acts on a group's Pending leaves, Delete All on its
  // Rejected ones. Leaves are sent one at a time so the parent cascade sees
  // each previous result (a parent is only rejected or deleted once none of
  // its children is left alive).
  const bulkTarget = ref<{ group: Group; action: BulkAction } | null>(null)
  // Reject All opens the reject modal instead, to ask for a note.
  const bulkOpen = computed({
    get: () => !!bulkTarget.value && bulkTarget.value.action !== 'reject',
    set: (value) => {
      if (!value && !bulkRunning.value) bulkTarget.value = null
    },
  })

  watch(
    () => bulkTarget.value?.action,
    (action) => {
      if (action === 'reject') rejectNote.value = ''
    },
  )

  // The bulk action running for `group`, if any.
  const bulkActionFor = (group: Group) => {
    const target = bulkTarget.value

    return bulkRunning.value &&
      target?.group[grouping!.idKey] === group[grouping!.idKey]
      ? target!.action
      : null
  }

  const BULK_TITLES: Record<BulkAction, string> = {
    approve: 'Approve All',
    reject: 'Reject All',
    delete: 'Delete All',
  }

  const bulkTitle = computed(() =>
    bulkTarget.value ? BULK_TITLES[bulkTarget.value.action] : '',
  )

  const bulkDescription = computed(() => {
    if (!bulkTarget.value) return ''

    const { group, action } = bulkTarget.value
    const count = bulkLeaves(group, action).length
    const noun = grouping!.nouns[count === 1 ? 0 : 1]

    return action === 'delete'
      ? `Are you sure you want to delete ${count} rejected ${noun} of ${grouping!.label(group)}? This action cannot be undone.`
      : `Are you sure you want to ${action} ${count} pending ${noun} of ${grouping!.label(group)}?`
  })

  const confirmBulk = async () => {
    const target = bulkTarget.value

    if (!target || busy.value) return
    if (target.action !== 'delete' && !isModerator.value) return

    const { group, action } = target

    bulkRunning.value = true

    let done = 0
    let lastError: unknown = null

    try {
      for (const leaf of bulkLeaves(group, action)) {
        try {
          if (action === 'delete') {
            await $fetch(`${leafUrl(leaf)}/${leaf.id}`, { method: 'delete' })
          } else {
            await postModeration(
              leaf,
              action,
              action === 'reject' ? rejectNote.value : undefined,
            )
          }
          done++
        } catch (error) {
          lastError = error
        }
      }

      if (done) {
        toast.add(
          successToast(action, {
            entity: countLabel(done, ...grouping!.nouns),
            scope: grouping!.label(group),
          }),
        )
      }

      if (lastError) {
        toast.add(errorToast(lastError, { showOriginalMessage: true }))
      }

      bulkTarget.value = null
      await refresh()
    } finally {
      bulkRunning.value = false
    }
  }

  const isBulkReject = computed(() => bulkTarget.value?.action === 'reject')

  const rejecting = computed(
    () =>
      processingId.value !== null || (isBulkReject.value && bulkRunning.value),
  )

  const rejectOpen = computed({
    get: () => !!rejectTarget.value || isBulkReject.value,
    set: (value) => {
      if (value || rejecting.value) return

      rejectTarget.value = null
      if (isBulkReject.value) bulkTarget.value = null
    },
  })

  const rejectTitle = computed(() =>
    isBulkReject.value ? BULK_TITLES.reject : `Reject ${entity}`,
  )

  const rejectDescription = computed(() =>
    isBulkReject.value
      ? bulkDescription.value
      : rejectTarget.value
        ? `Tell the submitter why ${label(rejectTarget.value)} is rejected.`
        : '',
  )

  const confirmReject = async () => {
    const result = reviewNoteSchema.safeParse(rejectNote.value)

    if (!result.success) {
      toast.add(validationToast(result.error.issues[0]?.message))
      return
    }

    rejectNote.value = result.data

    if (isBulkReject.value) {
      await confirmBulk()
    } else if (rejectTarget.value) {
      await moderate(rejectTarget.value, 'reject', result.data)
    }
  }

  return {
    isModerator,
    statusFilter,
    page,
    size,
    setPage,
    data,
    status,
    rows,
    paginationMeta,
    canEdit: canManage,
    canDelete: canManage,
    processingId,
    busy,
    moderate,
    deleteTarget,
    deleteOpen,
    deleting,
    deleteNote,
    deleteAsksReason,
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
  }
}
