type Leaf = Record<string, any>
type Group = Record<string, any>
type ModerationAction = 'approve' | 'reject'

/**
 * State and actions of a submission review page (`/{domain}/submissions`):
 * status filter, pagination, per-leaf Approve/Reject/Edit/Delete, the review
 * wizard modal, and, for grouped queues (keysets, keyboards), expandable
 * groups with Approve All / Reject All on their Pending leaves.
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
  const { isModerator } = storeToRefs(useUserStore())

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

  const postModeration = (leaf: Leaf, action: ModerationAction) =>
    $fetch(leafUrl(leaf), {
      method: 'post',
      body: { id: leaf.id, action },
    })

  const processingId = ref<number | null>(null)
  const bulkRunning = ref(false)
  const busy = computed(() => processingId.value !== null || bulkRunning.value)

  const moderate = async (leaf: Leaf, action: ModerationAction) => {
    if (!isModerator.value || busy.value) return

    processingId.value = leaf.id

    try {
      await postModeration(leaf, action)

      toast.add(handleSuccess(action, label(leaf), entity))
      await refresh()
    } catch (error) {
      toast.add(handleError(error, { showOriginalMessage: true }))
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

  const confirmDelete = async () => {
    const leaf = deleteTarget.value

    if (!leaf || deleting.value) return

    deleting.value = true

    try {
      await $fetch(`${leafUrl(leaf)}/${leaf.id}`, { method: 'delete' })

      toast.add(handleSuccess('delete', label(leaf), entity))
      deleteTarget.value = null
      await refresh()
    } catch (error) {
      toast.add(handleError(error, { showOriginalMessage: true }))
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
            (expanded.value as Record<string, boolean>)[
              group[grouping!.idKey]
            ],
        )),
  )

  const toggleAll = () => {
    expanded.value = allExpanded.value ? {} : true
  }

  const pendingLeaves = (group: Group): Leaf[] =>
    (group[grouping!.leavesKey] || []).filter(
      (leaf: Leaf) => statusOf(leaf) === 'Pending',
    )

  const countLabel = (count: number) =>
    `${count} ${grouping!.nouns[count === 1 ? 0 : 1]}`

  // Approve/Reject All acts on a group's Pending leaves only. Leaves are
  // posted one at a time so the parent cascade sees each previous result (a
  // parent is only rejected once none of its children is left alive).
  const bulkTarget = ref<{ group: Group; action: ModerationAction } | null>(
    null,
  )
  const bulkOpen = computed({
    get: () => !!bulkTarget.value,
    set: (value) => {
      if (!value && !bulkRunning.value) bulkTarget.value = null
    },
  })

  // The bulk action running for `group`, if any.
  const bulkActionFor = (group: Group) => {
    const target = bulkTarget.value

    return bulkRunning.value &&
      target?.group[grouping!.idKey] === group[grouping!.idKey]
      ? target!.action
      : null
  }

  const bulkTitle = computed(() =>
    bulkTarget.value?.action === 'approve' ? 'Approve All' : 'Reject All',
  )

  const bulkDescription = computed(() => {
    if (!bulkTarget.value) return ''

    const { group, action } = bulkTarget.value
    const count = pendingLeaves(group).length

    return `Are you sure you want to ${action} ${count} pending ${
      grouping!.nouns[count === 1 ? 0 : 1]
    } of ${grouping!.label(group)}?`
  })

  const confirmBulk = async () => {
    const target = bulkTarget.value

    if (!target || !isModerator.value || busy.value) return

    const { group, action } = target

    bulkRunning.value = true

    let done = 0
    let lastError: unknown = null

    try {
      for (const leaf of pendingLeaves(group)) {
        try {
          await postModeration(leaf, action)
          done++
        } catch (error) {
          lastError = error
        }
      }

      if (done) {
        toast.add(
          handleSuccess(
            action,
            `${countLabel(done)} of ${grouping!.label(group)}`,
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
    bulkTarget,
    bulkOpen,
    bulkRunning,
    bulkActionFor,
    bulkTitle,
    bulkDescription,
    confirmBulk,
  }
}
